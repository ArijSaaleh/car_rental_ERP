from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.agency import Agency
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.booking import Booking
from app.models.payment import Payment
from app.schemas.agency import AgencyCreate, AgencyUpdate, AgencyResponse
from app.schemas.user import UserCreate, UserResponse
from app.core.security import get_password_hash


router = APIRouter()


# ============ Helper Functions ============

def verify_agency_ownership(db: Session, agency_id: UUID, owner_id: Any) -> Agency:
    """Verify that the user owns the specified agency"""
    agency = db.query(Agency).filter(
        Agency.id == agency_id,
        Agency.owner_id == owner_id
    ).first()
    
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found or you don't have ownership"
        )
    
    return agency


# ============ Pydantic Response Models ============

from datetime import datetime
from typing import Optional


class AgencyListItem(BaseModel):
    """Schema for agency list item"""
    id: UUID
    name: str
    legal_name: str
    email: EmailStr
    phone: str
    city: str
    subscription_plan: str
    is_active: bool
    created_at: datetime
    manager_count: int
    employee_count: int
    vehicle_count: int
    customer_count: int
    
    model_config = ConfigDict(from_attributes=True)


class MultiAgencyStats(BaseModel):
    """Schema for multi-agency statistics"""
    total_agencies: int
    active_agencies: int
    total_users: int
    total_vehicles: int
    total_customers: int
    total_bookings: int
    total_revenue: float
    agencies: List[AgencyListItem]


class AgencySummary(BaseModel):
    """Schema for detailed agency summary"""
    id: UUID
    name: str
    legal_name: str
    tax_id: str
    email: EmailStr
    phone: str
    address: str
    city: str
    country: str
    subscription_plan: str
    subscription_start_date: datetime
    subscription_end_date: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    manager_count: int
    employee_count: int
    vehicle_count: int
    customer_count: int
    booking_count: int
    total_revenue: float
    managers: List['ManagerInfo']
    
    model_config = ConfigDict(from_attributes=True)


class ManagerInfo(BaseModel):
    """Schema for manager information"""
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class ManagerCreate(BaseModel):
    """Schema for creating/assigning a manager"""
    agency_id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    password: str


# ============ Endpoints ============

@router.get("/agencies", response_model=List[AgencyListItem])
async def get_owned_agencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all agencies owned by the current proprietaire
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Query agencies with aggregated counts
    agencies = db.query(Agency).filter(Agency.owner_id == current_user.id).all()
    
    result = []
    for agency in agencies:
        # Count managers and employees
        manager_count = db.query(User).filter(
            User.agency_id == agency.id,
            User.role == UserRole.MANAGER
        ).count()
        
        employee_count = db.query(User).filter(
            User.agency_id == agency.id,
            User.role == UserRole.EMPLOYEE
        ).count()
        
        # Count vehicles
        vehicle_count = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
        
        # Count customers
        customer_count = db.query(Customer).filter(Customer.agency_id == agency.id).count()
        
        # Create AgencyListItem with proper type handling
        agency_item = AgencyListItem.model_validate({
            **agency.__dict__,
            'subscription_plan': agency.subscription_plan.value,
            'manager_count': manager_count,
            'employee_count': employee_count,
            'vehicle_count': vehicle_count,
            'customer_count': customer_count
        })
        result.append(agency_item)
    
    return result


@router.get("/statistics", response_model=MultiAgencyStats)
async def get_multi_agency_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated statistics across all owned agencies
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Get all owned agencies
    agencies = db.query(Agency).filter(Agency.owner_id == current_user.id).all()
    agency_ids = [a.id for a in agencies]
    
    # Calculate totals
    total_agencies = len(agencies)
    active_agencies = sum(1 for a in agencies if bool(a.is_active))
    
    total_users = db.query(User).filter(User.agency_id.in_(agency_ids)).count() if agency_ids else 0
    total_vehicles = db.query(Vehicle).filter(Vehicle.agency_id.in_(agency_ids)).count() if agency_ids else 0
    total_customers = db.query(Customer).filter(Customer.agency_id.in_(agency_ids)).count() if agency_ids else 0
    total_bookings = db.query(Booking).filter(Booking.agency_id.in_(agency_ids)).count() if agency_ids else 0
    
    # Calculate total revenue
    total_revenue_result = db.query(func.sum(Payment.amount)).filter(
        Payment.agency_id.in_(agency_ids)
    ).scalar() if agency_ids else 0
    total_revenue = float(total_revenue_result) if total_revenue_result else 0.0
    
    # Build agency list with details
    agency_list = []
    for agency in agencies:
        manager_count = db.query(User).filter(
            User.agency_id == agency.id,
            User.role == UserRole.MANAGER
        ).count()
        
        employee_count = db.query(User).filter(
            User.agency_id == agency.id,
            User.role == UserRole.EMPLOYEE
        ).count()
        
        vehicle_count = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
        customer_count = db.query(Customer).filter(Customer.agency_id == agency.id).count()
        
        agency_item = AgencyListItem.model_validate({
            **agency.__dict__,
            'subscription_plan': agency.subscription_plan.value,
            'manager_count': manager_count,
            'employee_count': employee_count,
            'vehicle_count': vehicle_count,
            'customer_count': customer_count
        })
        agency_list.append(agency_item)
    
    return MultiAgencyStats(
        total_agencies=total_agencies,
        active_agencies=active_agencies,
        total_users=total_users,
        total_vehicles=total_vehicles,
        total_customers=total_customers,
        total_bookings=total_bookings,
        total_revenue=total_revenue,
        agencies=agency_list
    )


@router.get("/agencies/{agency_id}", response_model=AgencySummary)
async def get_agency_details(
    agency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Verify ownership
    agency = verify_agency_ownership(db, agency_id, current_user.id)
    
    # Get managers
    managers = db.query(User).filter(
        User.agency_id == agency.id,
        User.role == UserRole.MANAGER
    ).all()
    
    manager_list = [ManagerInfo.model_validate(m) for m in managers]
    
    # Count stats
    manager_count = len(managers)
    employee_count = db.query(User).filter(
        User.agency_id == agency.id,
        User.role == UserRole.EMPLOYEE
    ).count()
    vehicle_count = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
    customer_count = db.query(Customer).filter(Customer.agency_id == agency.id).count()
    booking_count = db.query(Booking).filter(Booking.agency_id == agency.id).count()
    
    # Calculate revenue
    revenue_result = db.query(func.sum(Payment.amount)).filter(
        Payment.agency_id == agency.id
    ).scalar()
    total_revenue = float(revenue_result) if revenue_result else 0.0
    
    return AgencySummary.model_validate({
        **agency.__dict__,
        'subscription_plan': agency.subscription_plan.value,
        'manager_count': manager_count,
        'employee_count': employee_count,
        'vehicle_count': vehicle_count,
        'customer_count': customer_count,
        'booking_count': booking_count,
        'total_revenue': total_revenue,
        'managers': manager_list
    })


@router.post("/agencies", response_model=AgencyResponse, status_code=status.HTTP_201_CREATED)
async def create_agency(
    agency_data: AgencyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can create agencies"
        )
    
    # Check if email or tax_id already exists
    existing_email = db.query(Agency).filter(Agency.email == agency_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An agency with this email already exists"
        )
    
    existing_tax = db.query(Agency).filter(Agency.tax_id == agency_data.tax_id).first()
    if existing_tax:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An agency with this tax ID already exists"
        )
    
    # Create new agency
    new_agency = Agency(
        owner_id=current_user.id,
        name=agency_data.name,
        legal_name=agency_data.legal_name,
        tax_id=agency_data.tax_id,
        email=agency_data.email,
        phone=agency_data.phone,
        address=agency_data.address,
        city=agency_data.city,
        country=agency_data.country,
        subscription_plan=agency_data.subscription_plan
    )
    
    db.add(new_agency)
    db.commit()
    db.refresh(new_agency)
    
    return new_agency


@router.put("/agencies/{agency_id}", response_model=AgencyResponse)
async def update_agency(
    agency_id: UUID,
    agency_data: AgencyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update agency information
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can update agencies"
        )
    
    # Verify ownership
    agency = verify_agency_ownership(db, agency_id, current_user.id)
    
    # Update fields
    update_data = agency_data.model_dump(exclude_unset=True)
    
    # Check for email uniqueness if being updated
    if "email" in update_data and update_data["email"] != agency.email:
        existing = db.query(Agency).filter(Agency.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An agency with this email already exists"
            )
    
    for key, value in update_data.items():
        setattr(agency, key, value)
    
    db.commit()
    db.refresh(agency)
    
    return agency


@router.post("/agencies/{agency_id}/toggle-status", response_model=AgencyResponse)
async def toggle_agency_status(
    agency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle agency active status
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can toggle agency status"
        )
    
    # Verify ownership
    agency = verify_agency_ownership(db, agency_id, current_user.id)
    
    # Toggle status
    setattr(agency, 'is_active', not bool(agency.is_active))
    
    db.commit()
    db.refresh(agency)
    
    return agency


@router.get("/agencies/{agency_id}/managers", response_model=List[ManagerInfo])
async def get_agency_managers(
    agency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all managers for a specific agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Get managers
    managers = db.query(User).filter(
        User.agency_id == agency_id,
        User.role == UserRole.MANAGER
    ).all()
    
    return [ManagerInfo.model_validate(m) for m in managers]


@router.post("/agencies/{agency_id}/managers", response_model=ManagerInfo, status_code=status.HTTP_201_CREATED)
async def assign_manager(
    agency_id: UUID,
    manager_data: ManagerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a new manager to an agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can assign managers"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Verify agency_id matches
    if manager_data.agency_id != agency_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agency ID mismatch"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == manager_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Create new manager
    hashed_password = get_password_hash(manager_data.password)
    new_manager = User(
        email=manager_data.email,
        full_name=manager_data.full_name,
        phone=manager_data.phone,
        hashed_password=hashed_password,
        role=UserRole.MANAGER,
        agency_id=agency_id,
        is_active=True,
        is_verified=True
    )
    
    db.add(new_manager)
    db.commit()
    db.refresh(new_manager)
    
    return ManagerInfo.model_validate(new_manager)


@router.delete("/agencies/{agency_id}/managers/{manager_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_manager(
    agency_id: UUID,
    manager_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a manager from an agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can remove managers"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Find manager
    manager = db.query(User).filter(
        User.id == manager_id,
        User.agency_id == agency_id,
        User.role == UserRole.MANAGER
    ).first()
    
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found in this agency"
        )
    
    # Delete manager
    db.delete(manager)
    db.commit()
    
    return None
