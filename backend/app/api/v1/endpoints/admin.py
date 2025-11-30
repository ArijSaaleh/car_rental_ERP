"""
Super Admin endpoints
Only accessible by users with SUPER_ADMIN role
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.services.admin_service import AdminService
from app.schemas.admin import (
    AgencyOnboardingRequest,
    AgencyOnboardingResponse,
    PlatformStats,
    AgencyHealthStatus,
    SubscriptionChangeRequest,
    SubscriptionChangeResponse,
    BulkAgencyOperation,
    BulkOperationResult,
    AuditLogEntry,
    AuditLogFilter,
    PlatformRevenueReport,
    CreateAgencyOwner,
    UserManagementAction
)


router = APIRouter()


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is super admin"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can access this endpoint"
        )
    return current_user


# ==================== AGENCY MANAGEMENT ====================

@router.post("/agencies/onboard", response_model=AgencyOnboardingResponse)
async def onboard_agency(
    request: AgencyOnboardingRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Onboard a new agency with owner account
    Creates agency and owner user in one transaction
    """
    try:
        result = AdminService.onboard_agency(db, request, admin)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to onboard agency: {str(e)}"
        )


@router.get("/agencies", response_model=List[dict])
async def list_all_agencies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    is_active: bool = Query(None),
    plan: SubscriptionPlan = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    List all agencies across the platform with filtering
    """
    query = db.query(Agency)
    
    if is_active is not None:
        query = query.filter(Agency.is_active == is_active)
    
    if plan:
        query = query.filter(Agency.subscription_plan == plan)
    
    agencies = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(agency.id),
            "name": agency.name,
            "email": agency.email,
            "phone": agency.phone,
            "city": agency.city,
            "subscription_plan": agency.subscription_plan.value,
            "is_active": agency.is_active,
            "trial_ends_at": agency.trial_ends_at,
            "created_at": agency.created_at
        }
        for agency in agencies
    ]


@router.get("/agencies/{agency_id}")
async def get_agency_details(
    agency_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Get detailed information about a specific agency
    """
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    # Get agency users count
    from app.models.user import User as UserModel
    from app.models.vehicle import Vehicle
    from app.models.booking import Booking
    
    users_count = db.query(UserModel).filter(UserModel.agency_id == agency_id).count()
    vehicles_count = db.query(Vehicle).filter(Vehicle.agency_id == agency_id).count()
    bookings_count = db.query(Booking).filter(Booking.agency_id == agency_id).count()
    
    return {
        "id": str(agency.id),
        "name": agency.name,
        "email": agency.email,
        "phone": agency.phone,
        "address": agency.address,
        "city": agency.city,
        "postal_code": agency.postal_code,
        "country": agency.country,
        "tax_id": agency.tax_id,
        "subscription_plan": agency.subscription_plan.value,
        "is_active": agency.is_active,
        "trial_ends_at": agency.trial_ends_at,
        "created_at": agency.created_at,
        "statistics": {
            "total_users": users_count,
            "total_vehicles": vehicles_count,
            "total_bookings": bookings_count
        }
    }


@router.patch("/agencies/{agency_id}/toggle-status")
async def toggle_agency_status(
    agency_id: str,
    reason: str = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Activate or deactivate an agency
    """
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    previous_status = agency.is_active
    agency.is_active = not agency.is_active
    
    # Log the action
    AdminService._log_action(
        db=db,
        admin_user=admin,
        action="toggle_agency_status",
        resource_type="agency",
        resource_id=str(agency.id),
        details={
            "agency_name": agency.name,
            "previous_status": previous_status,
            "new_status": agency.is_active,
            "reason": reason
        }
    )
    
    db.commit()
    
    return {
        "message": f"Agency {'activated' if agency.is_active else 'deactivated'} successfully",
        "agency_id": str(agency.id),
        "is_active": agency.is_active
    }


# ==================== PLATFORM STATISTICS ====================

@router.get("/statistics", response_model=PlatformStats)
async def get_platform_statistics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Get comprehensive platform statistics
    """
    stats = AdminService.get_platform_statistics(db)
    return stats


@router.get("/agencies/health", response_model=List[AgencyHealthStatus])
async def get_agencies_health_status(
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Get health status for all agencies
    """
    health_statuses = AdminService.get_agencies_health(db)
    return health_statuses


# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.post("/subscriptions/change", response_model=SubscriptionChangeResponse)
async def change_subscription(
    request: SubscriptionChangeRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Change agency subscription plan
    """
    try:
        result = AdminService.change_subscription(db, request, admin)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# ==================== BULK OPERATIONS ====================

@router.post("/bulk/deactivate-agencies", response_model=BulkOperationResult)
async def bulk_deactivate_agencies(
    operation: BulkAgencyOperation,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Bulk deactivate multiple agencies
    """
    result = AdminService.bulk_deactivate_agencies(
        db=db,
        agency_ids=operation.agency_ids,
        admin_user=admin,
        reason=operation.reason
    )
    return result


# ==================== REVENUE & REPORTING ====================

@router.get("/revenue/report", response_model=PlatformRevenueReport)
async def get_revenue_report(
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Generate platform-wide revenue report
    """
    # Default to last 30 days if not specified
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    report = AdminService.get_revenue_report(db, start_date, end_date)
    return report


# ==================== AUDIT LOGS ====================

@router.post("/audit-logs", response_model=List[AuditLogEntry])
async def get_audit_logs(
    filters: AuditLogFilter,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Get audit logs with filtering
    """
    logs = AdminService.get_audit_logs(db, filters)
    
    return [
        {
            "id": str(log.id),
            "admin_id": str(log.admin_id),
            "admin_email": log.admin_email,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.created_at
        }
        for log in logs
    ]


# ==================== USER MANAGEMENT ====================

@router.get("/users/all")
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    role: UserRole = Query(None),
    agency_id: str = Query(None),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    List all users across all agencies
    """
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    if agency_id:
        query = query.filter(User.agency_id == agency_id)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "agency_id": str(user.agency_id) if user.agency_id else None,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
        for user in users
    ]


@router.post("/users/create-owner")
async def create_agency_owner(
    request: CreateAgencyOwner,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Create a new agency owner for an existing agency
    """
    from app.core.security import get_password_hash
    
    # Verify agency exists
    agency = db.query(Agency).filter(Agency.id == request.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create owner
    owner = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        phone=request.phone,
        role=UserRole.PROPRIETAIRE,
        agency_id=request.agency_id,
        is_active=True,
        is_verified=True
    )
    
    db.add(owner)
    
    # Log action
    AdminService._log_action(
        db=db,
        admin_user=admin,
        action="create_agency_owner",
        resource_type="user",
        resource_id=str(owner.id),
        details={
            "agency_id": request.agency_id,
            "owner_email": request.email
        }
    )
    
    db.commit()
    db.refresh(owner)
    
    return {
        "message": "Agency owner created successfully",
        "user_id": str(owner.id),
        "email": owner.email
    }
