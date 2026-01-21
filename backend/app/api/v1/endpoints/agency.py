"""
Agency Settings endpoints for proprietaires
Allows agency owners to manage their agency settings and information
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, check_permission, get_current_tenant
from app.models.user import User, UserRole
from app.models.agency import Agency, SubscriptionPlan
from app.schemas.agency import AgencyResponse, AgencyUpdate, AgencyWithFeatures
from app.middleware.feature_flags import FeatureFlags


router = APIRouter(prefix="/agency", tags=["Agency Management"])


@router.get("/", response_model=List[AgencyResponse])
async def get_agencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all agencies owned by the current user (PROPRIETAIRE only)
    
    Returns: List of agencies where current user is the owner
    """
    if current_user.role != UserRole.PROPRIETAIRE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les propriétaires peuvent accéder à cette ressource"
        )
    
    agencies = db.query(Agency).filter(Agency.owner_id == current_user.id).all()
    return agencies


@router.get("/me", response_model=AgencyWithFeatures)
async def get_my_agency(
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get current agency information with available features
    
    Accessible par: PROPRIETAIRE, MANAGER, EMPLOYEE (all authenticated users)
    """
    # Get features for the subscription plan
    features = FeatureFlags.get_plan_features(agency.subscription_plan)
    
    return AgencyWithFeatures(
        **agency.__dict__,
        available_features=features
    )


@router.put("/me", response_model=AgencyResponse)
async def update_my_agency(
    agency_data: AgencyUpdate,
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Update current agency information
    
    Accessible par: PROPRIETAIRE only
    
    Note: Cannot change subscription_plan through this endpoint (use upgrade/downgrade endpoints)
    """
    # Update agency fields
    update_data = agency_data.model_dump(exclude_unset=True, exclude={'subscription_plan'})
    
    # Check if tax_id is being changed and ensure uniqueness
    if "tax_id" in update_data and update_data["tax_id"] != agency.tax_id:
        existing_agency = db.query(Agency).filter(Agency.tax_id == update_data["tax_id"]).first()
        if existing_agency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce matricule fiscal est déjà utilisé par une autre agence"
            )
    
    # Check if email is being changed and ensure uniqueness
    if "email" in update_data and update_data["email"] != agency.email:
        existing_agency = db.query(Agency).filter(Agency.email == update_data["email"]).first()
        if existing_agency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé par une autre agence"
            )
    
    for field, value in update_data.items():
        setattr(agency, field, value)
    
    db.commit()
    db.refresh(agency)
    
    return agency


@router.get("/subscription/info", response_model=dict)
async def get_subscription_info(
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get detailed subscription information
    
    Accessible par: PROPRIETAIRE, MANAGER, EMPLOYEE
    """
    features = FeatureFlags.get_plan_features(agency.subscription_plan)
    
    # Calculate days remaining
    from datetime import datetime
    days_remaining = None
    if agency.subscription_end_date:
        delta = agency.subscription_end_date - datetime.now(agency.subscription_end_date.tzinfo)
        days_remaining = max(0, delta.days)
    
    return {
        "current_plan": agency.subscription_plan,
        "start_date": agency.subscription_start_date,
        "end_date": agency.subscription_end_date,
        "days_remaining": days_remaining,
        "is_active": agency.is_active,
        "available_features": features,
        "all_plans": {
            "BASIQUE": {
                "name": "Basique",
                "features": FeatureFlags.get_plan_features(SubscriptionPlan.BASIQUE),
                "description": "Gestion de flotte uniquement"
            },
            "STANDARD": {
                "name": "Standard",
                "features": FeatureFlags.get_plan_features(SubscriptionPlan.STANDARD),
                "description": "Flotte + Tarification + Contrats"
            },
            "PREMIUM": {
                "name": "Premium",
                "features": FeatureFlags.get_plan_features(SubscriptionPlan.PREMIUM),
                "description": "Standard + Automatisation OCR"
            },
            "ENTREPRISE": {
                "name": "Entreprise",
                "features": FeatureFlags.get_plan_features(SubscriptionPlan.ENTREPRISE),
                "description": "Premium + Yield Management"
            }
        }
    }


@router.get("/features/check/{feature}", response_model=dict)
async def check_feature_access(
    feature: str,
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Check if current agency has access to a specific feature
    
    Accessible par: All authenticated users
    """
    has_access = FeatureFlags.has_feature(agency, feature)
    required_plan = FeatureFlags.get_required_plan(feature)
    
    return {
        "feature": feature,
        "has_access": has_access,
        "current_plan": agency.subscription_plan,
        "required_plan": required_plan
    }


@router.get("/statistics", response_model=dict)
async def get_agency_statistics(
    current_user: User = Depends(check_permission(UserRole.PROPRIETAIRE)),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive agency statistics
    
    Accessible par: PROPRIETAIRE only
    """
    from app.models.vehicle import Vehicle
    from app.models.booking import Booking
    from app.models.customer import Customer
    from app.models.payment import Payment
    from sqlalchemy import func
    
    # User statistics
    total_users = db.query(User).filter(User.agency_id == agency.id).count()
    active_users = db.query(User).filter(
        User.agency_id == agency.id,
        User.is_active == True
    ).count()
    
    # Vehicle statistics
    total_vehicles = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
    
    # Customer statistics
    total_customers = db.query(Customer).filter(Customer.agency_id == agency.id).count()
    
    # Booking statistics
    total_bookings = db.query(Booking).filter(Booking.agency_id == agency.id).count()
    active_bookings = db.query(Booking).filter(
        Booking.agency_id == agency.id,
        Booking.status.in_(['confirmed', 'active'])
    ).count()
    
    # Revenue statistics
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.agency_id == agency.id,
        Payment.status == 'completed'
    ).scalar() or 0
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users
        },
        "vehicles": {
            "total": total_vehicles
        },
        "customers": {
            "total": total_customers
        },
        "bookings": {
            "total": total_bookings,
            "active": active_bookings,
            "completed": total_bookings - active_bookings
        },
        "revenue": {
            "total": float(total_revenue),
            "currency": "TND"
        },
        "subscription": {
            "plan": agency.subscription_plan,
            "is_active": agency.is_active
        }
    }
