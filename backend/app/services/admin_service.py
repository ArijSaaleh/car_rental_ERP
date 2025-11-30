"""
Admin service for super admin operations
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import uuid

from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.audit_log import AuditLog
from app.core.security import get_password_hash
from app.schemas.admin import (
    AgencyOnboardingRequest,
    SubscriptionChangeRequest,
    AuditLogFilter
)


class AdminService:
    """Service class for super admin operations"""
    
    @staticmethod
    def onboard_agency(
        db: Session,
        request: AgencyOnboardingRequest,
        admin_user: User
    ) -> Dict[str, Any]:
        """
        Complete agency onboarding with owner account creation
        """
        # Create agency
        agency = Agency(
            name=request.agency_name,
            email=request.email,
            phone=request.phone,
            address=request.address,
            city=request.city,
            postal_code=request.postal_code,
            country=request.country,
            tax_id=request.tax_id,
            subscription_plan=request.subscription_plan,
            is_active=True
        )
        
        # Set trial period
        if request.trial_days > 0:
            agency.trial_ends_at = datetime.utcnow() + timedelta(days=request.trial_days)
        
        db.add(agency)
        db.flush()
        
        # Create owner account
        owner = User(
            email=request.owner_email,
            hashed_password=get_password_hash(request.owner_password),
            full_name=request.owner_full_name,
            phone=request.owner_phone,
            role=UserRole.PROPRIETAIRE,
            agency_id=agency.id,
            is_active=True,
            is_verified=True
        )
        
        db.add(owner)
        db.flush()
        
        # Log the action
        AdminService._log_action(
            db=db,
            admin_user=admin_user,
            action="onboard_agency",
            resource_type="agency",
            resource_id=str(agency.id),
            details={
                "agency_name": agency.name,
                "owner_email": owner.email,
                "subscription_plan": request.subscription_plan.value,
                "trial_days": request.trial_days
            }
        )
        
        db.commit()
        db.refresh(agency)
        db.refresh(owner)
        
        return {
            "agency_id": str(agency.id),
            "agency_name": agency.name,
            "owner_id": str(owner.id),
            "owner_email": owner.email,
            "subscription_plan": agency.subscription_plan.value,
            "trial_ends_at": agency.trial_ends_at,
            "message": "Agency onboarded successfully"
        }
    
    @staticmethod
    def get_platform_statistics(db: Session) -> Dict[str, Any]:
        """
        Get comprehensive platform statistics
        """
        # Count agencies
        total_agencies = db.query(Agency).count()
        active_agencies = db.query(Agency).filter(Agency.is_active == True).count()
        
        # Count users
        total_users = db.query(User).count()
        
        # Count vehicles
        total_vehicles = db.query(Vehicle).count()
        
        # Count customers
        total_customers = db.query(Customer).count()
        
        # Count bookings
        total_bookings = db.query(Booking).count()
        active_bookings = db.query(Booking).filter(
            Booking.status.in_(["pending", "confirmed", "in_progress"])
        ).count()
        
        # Calculate total revenue
        total_revenue = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "completed"
        ).scalar() or 0.0
        
        # Agencies by plan
        agencies_by_plan = {}
        for plan in SubscriptionPlan:
            count = db.query(Agency).filter(Agency.subscription_plan == plan).count()
            agencies_by_plan[plan.value] = count
        
        return {
            "total_agencies": total_agencies,
            "active_agencies": active_agencies,
            "total_users": total_users,
            "total_vehicles": total_vehicles,
            "total_customers": total_customers,
            "total_bookings": total_bookings,
            "total_revenue": float(total_revenue),
            "active_bookings": active_bookings,
            "agencies_by_plan": agencies_by_plan
        }
    
    @staticmethod
    def get_agencies_health(db: Session) -> List[Dict[str, Any]]:
        """
        Get health status for all agencies
        """
        agencies = db.query(Agency).all()
        health_statuses = []
        
        for agency in agencies:
            # Count resources
            total_users = db.query(User).filter(User.agency_id == agency.id).count()
            total_vehicles = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
            total_bookings = db.query(Booking).filter(Booking.agency_id == agency.id).count()
            
            # Get last booking date
            last_booking = db.query(Booking).filter(
                Booking.agency_id == agency.id
            ).order_by(Booking.created_at.desc()).first()
            
            last_booking_date = last_booking.created_at if last_booking else None
            
            # Calculate health score (0-100)
            health_score = AdminService._calculate_health_score(
                is_active=agency.is_active,
                total_users=total_users,
                total_vehicles=total_vehicles,
                total_bookings=total_bookings,
                last_booking_date=last_booking_date
            )
            
            # Determine status
            if not agency.is_active:
                status = "inactive"
            elif health_score >= 80:
                status = "healthy"
            elif health_score >= 50:
                status = "warning"
            else:
                status = "critical"
            
            health_statuses.append({
                "agency_id": str(agency.id),
                "agency_name": agency.name,
                "is_active": agency.is_active,
                "subscription_plan": agency.subscription_plan.value,
                "total_users": total_users,
                "total_vehicles": total_vehicles,
                "total_bookings": total_bookings,
                "last_booking_date": last_booking_date,
                "health_score": health_score,
                "status": status
            })
        
        return health_statuses
    
    @staticmethod
    def change_subscription(
        db: Session,
        request: SubscriptionChangeRequest,
        admin_user: User
    ) -> Dict[str, Any]:
        """
        Change agency subscription plan
        """
        agency = db.query(Agency).filter(Agency.id == request.agency_id).first()
        
        if not agency:
            raise ValueError("Agency not found")
        
        previous_plan = agency.subscription_plan
        agency.subscription_plan = request.new_plan
        
        # Log the action
        AdminService._log_action(
            db=db,
            admin_user=admin_user,
            action="change_subscription",
            resource_type="agency",
            resource_id=str(agency.id),
            details={
                "agency_name": agency.name,
                "previous_plan": previous_plan.value,
                "new_plan": request.new_plan.value,
                "reason": request.reason
            }
        )
        
        db.commit()
        
        return {
            "agency_id": str(agency.id),
            "previous_plan": previous_plan.value,
            "new_plan": request.new_plan.value,
            "changed_at": datetime.utcnow(),
            "changed_by": admin_user.email,
            "message": "Subscription changed successfully"
        }
    
    @staticmethod
    def bulk_deactivate_agencies(
        db: Session,
        agency_ids: List[str],
        admin_user: User,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Bulk deactivate multiple agencies
        """
        results = []
        successful = 0
        failed = 0
        
        for agency_id in agency_ids:
            try:
                agency = db.query(Agency).filter(Agency.id == agency_id).first()
                
                if not agency:
                    results.append({
                        "agency_id": agency_id,
                        "success": False,
                        "error": "Agency not found"
                    })
                    failed += 1
                    continue
                
                agency.is_active = False
                
                # Log the action
                AdminService._log_action(
                    db=db,
                    admin_user=admin_user,
                    action="deactivate_agency",
                    resource_type="agency",
                    resource_id=str(agency.id),
                    details={
                        "agency_name": agency.name,
                        "reason": reason
                    }
                )
                
                results.append({
                    "agency_id": agency_id,
                    "agency_name": agency.name,
                    "success": True
                })
                successful += 1
                
            except Exception as e:
                results.append({
                    "agency_id": agency_id,
                    "success": False,
                    "error": str(e)
                })
                failed += 1
        
        db.commit()
        
        return {
            "total_requested": len(agency_ids),
            "successful": successful,
            "failed": failed,
            "results": results
        }
    
    @staticmethod
    def get_revenue_report(
        db: Session,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Generate platform-wide revenue report
        """
        # Get all agencies
        agencies = db.query(Agency).all()
        agencies_revenue = []
        total_platform_revenue = 0.0
        revenue_by_plan = {}
        
        for agency in agencies:
            # Calculate revenue for this agency
            agency_revenue = db.query(func.sum(Payment.amount)).filter(
                and_(
                    Payment.agency_id == agency.id,
                    Payment.status == "completed",
                    Payment.created_at >= start_date,
                    Payment.created_at <= end_date
                )
            ).scalar() or 0.0
            
            # Count bookings
            agency_bookings = db.query(Booking).filter(
                and_(
                    Booking.agency_id == agency.id,
                    Booking.created_at >= start_date,
                    Booking.created_at <= end_date
                )
            ).count()
            
            avg_booking_value = (float(agency_revenue) / agency_bookings) if agency_bookings > 0 else 0.0
            
            agencies_revenue.append({
                "agency_id": str(agency.id),
                "agency_name": agency.name,
                "total_revenue": float(agency_revenue),
                "total_bookings": agency_bookings,
                "avg_booking_value": avg_booking_value,
                "subscription_plan": agency.subscription_plan.value
            })
            
            total_platform_revenue += float(agency_revenue)
            
            # Aggregate by plan
            plan = agency.subscription_plan.value
            revenue_by_plan[plan] = revenue_by_plan.get(plan, 0.0) + float(agency_revenue)
        
        return {
            "total_revenue": total_platform_revenue,
            "period_start": start_date,
            "period_end": end_date,
            "agencies": agencies_revenue,
            "revenue_by_plan": revenue_by_plan
        }
    
    @staticmethod
    def get_audit_logs(
        db: Session,
        filters: AuditLogFilter
    ) -> List[AuditLog]:
        """
        Get audit logs with filtering
        """
        query = db.query(AuditLog)
        
        if filters.admin_id:
            query = query.filter(AuditLog.admin_id == filters.admin_id)
        
        if filters.action:
            query = query.filter(AuditLog.action == filters.action)
        
        if filters.resource_type:
            query = query.filter(AuditLog.resource_type == filters.resource_type)
        
        if filters.start_date:
            query = query.filter(AuditLog.created_at >= filters.start_date)
        
        if filters.end_date:
            query = query.filter(AuditLog.created_at <= filters.end_date)
        
        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset(filters.offset).limit(filters.limit)
        
        return query.all()
    
    @staticmethod
    def _log_action(
        db: Session,
        admin_user: User,
        action: str,
        resource_type: str,
        resource_id: Optional[str],
        details: Dict[str, Any],
        ip_address: Optional[str] = None
    ):
        """
        Log super admin action
        """
        log_entry = AuditLog(
            admin_id=admin_user.id,
            admin_email=admin_user.email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        
        db.add(log_entry)
    
    @staticmethod
    def _calculate_health_score(
        is_active: bool,
        total_users: int,
        total_vehicles: int,
        total_bookings: int,
        last_booking_date: Optional[datetime]
    ) -> float:
        """
        Calculate agency health score (0-100)
        """
        if not is_active:
            return 0.0
        
        score = 0.0
        
        # Active status: 20 points
        score += 20
        
        # Has users: 20 points
        if total_users > 0:
            score += min(20, total_users * 5)
        
        # Has vehicles: 20 points
        if total_vehicles > 0:
            score += min(20, total_vehicles * 2)
        
        # Has bookings: 20 points
        if total_bookings > 0:
            score += min(20, total_bookings * 0.5)
        
        # Recent activity: 20 points
        if last_booking_date:
            days_since_last_booking = (datetime.utcnow() - last_booking_date).days
            if days_since_last_booking <= 7:
                score += 20
            elif days_since_last_booking <= 30:
                score += 15
            elif days_since_last_booking <= 90:
                score += 10
            else:
                score += 5
        
        return min(100.0, score)
