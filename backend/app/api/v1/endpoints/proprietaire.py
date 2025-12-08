from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime, date
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

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
    tax_id: str
    email: EmailStr
    phone: str
    address: str
    city: str
    postal_code: Optional[str] = None
    country: str
    subscription_plan: str
    is_active: bool
    created_at: datetime
    parent_agency_id: Optional[UUID] = None
    is_main: bool  # True if main agency, False if branch
    branch_count: int = 0  # Number of branches (only for main agencies)
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


class ConsolidatedStats(BaseModel):
    """Schema for consolidated statistics (main agency + all branches)"""
    main_agency_id: UUID
    main_agency_name: str
    branch_count: int
    total_users: int
    total_vehicles: int
    total_customers: int
    total_bookings: int
    total_revenue: float
    branches: List[AgencyListItem]


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


# Rebuild models to resolve forward references
AgencySummary.model_rebuild()


# ============ Endpoints ============

@router.get("/agencies", response_model=List[AgencyListItem])
async def get_owned_agencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all agencies owned by the current proprietaire
    Returns main agency + branches in hierarchical structure
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Query ALL agencies (main + branches)
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
            User.role.in_([UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
        ).count()
        
        # Count vehicles
        vehicle_count = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
        
        # Count customers
        customer_count = db.query(Customer).filter(Customer.agency_id == agency.id).count()
        
        # Count branches (only for main agencies)
        branch_count = 0
        is_main = agency.parent_agency_id is None
        if is_main:
            branch_count = db.query(Agency).filter(
                Agency.parent_agency_id == agency.id
            ).count()
        
        # Create AgencyListItem with hierarchy info
        agency_item = AgencyListItem.model_validate({
            **agency.__dict__,
            'subscription_plan': agency.subscription_plan.value,
            'is_main': is_main,
            'branch_count': branch_count,
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
    Get aggregated statistics across all owned agencies (main + branches)
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Get all owned agencies (main + branches)
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
    
    # Build agency list with details + hierarchy info
    agency_list = []
    for agency in agencies:
        manager_count = db.query(User).filter(
            User.agency_id == agency.id,
            User.role == UserRole.MANAGER
        ).count()
        
        employee_count = db.query(User).filter(
            User.agency_id == agency.id,
            User.role.in_([UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
        ).count()
        
        vehicle_count = db.query(Vehicle).filter(Vehicle.agency_id == agency.id).count()
        customer_count = db.query(Customer).filter(Customer.agency_id == agency.id).count()
        
        # Count branches (only for main agencies)
        branch_count = 0
        is_main = agency.parent_agency_id is None
        if is_main:
            branch_count = db.query(Agency).filter(
                Agency.parent_agency_id == agency.id
            ).count()
        
        agency_item = AgencyListItem.model_validate({
            **agency.__dict__,
            'subscription_plan': agency.subscription_plan.value,
            'is_main': is_main,
            'branch_count': branch_count,
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
        User.role.in_([UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
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
    Create a new agency or branch
    Enforces subscription plan limits:
    - BASIQUE/STANDARD: No branches allowed
    - PREMIUM: Max 3 branches
    - ENTREPRISE: Unlimited branches
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can create agencies"
        )
    
    # If creating a branch, validate subscription plan limits
    if agency_data.parent_agency_id:
        # Get the main agency
        main_agency = db.query(Agency).filter(
            Agency.id == agency_data.parent_agency_id,
            Agency.owner_id == current_user.id,
            Agency.parent_agency_id.is_(None)  # Must be a main agency
        ).first()
        
        if not main_agency:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Main agency not found or you don't have ownership"
            )
        
        # Check subscription plan allows branches
        max_branches = main_agency.get_max_agencies()
        if max_branches == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Votre plan {main_agency.subscription_plan.value.upper()} ne permet pas de créer des succursales. Passez au plan PREMIUM ou ENTREPRISE."
            )
        
        # Check current branch count
        if max_branches > 0:  # -1 means unlimited
            current_branches = db.query(Agency).filter(
                Agency.parent_agency_id == main_agency.id
            ).count()
            
            if current_branches >= max_branches:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Limite atteinte: Votre plan {main_agency.subscription_plan.value.upper()} permet maximum {max_branches} succursale(s). Vous en avez déjà {current_branches}."
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
    
    # Create new agency or branch
    new_agency = Agency(
        owner_id=current_user.id,
        parent_agency_id=agency_data.parent_agency_id,
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
    
    # If this is the first agency (main agency), associate proprietaire with it
    if not agency_data.parent_agency_id:
        agencies_count = db.query(Agency).filter(
            Agency.owner_id == current_user.id,
            Agency.parent_agency_id.is_(None)
        ).count()
        
        if agencies_count == 0:  # This will be the first main agency
            current_user.agency_id = new_agency.id
    
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


@router.get("/agencies/{agency_id}/consolidated-stats", response_model=ConsolidatedStats)
async def get_consolidated_statistics(
    agency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get consolidated statistics for a main agency + all its branches
    Returns combined stats across the entire agency network
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Verify ownership and ensure it's a main agency
    main_agency = verify_agency_ownership(db, agency_id, current_user.id)
    
    if main_agency.parent_agency_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint only works for main agencies, not branches"
        )
    
    # Get all branches
    branches = db.query(Agency).filter(
        Agency.parent_agency_id == agency_id
    ).all()
    
    # Collect all agency IDs (main + branches)
    all_agency_ids = [agency_id] + [b.id for b in branches]
    
    # Calculate consolidated stats
    total_users = db.query(User).filter(User.agency_id.in_(all_agency_ids)).count()
    total_vehicles = db.query(Vehicle).filter(Vehicle.agency_id.in_(all_agency_ids)).count()
    total_customers = db.query(Customer).filter(Customer.agency_id.in_(all_agency_ids)).count()
    total_bookings = db.query(Booking).filter(Booking.agency_id.in_(all_agency_ids)).count()
    
    # Calculate total revenue
    revenue_result = db.query(func.sum(Payment.amount)).filter(
        Payment.agency_id.in_(all_agency_ids)
    ).scalar()
    total_revenue = float(revenue_result) if revenue_result else 0.0
    
    # Build branch list with details
    branch_list = []
    for branch in branches:
        manager_count = db.query(User).filter(
            User.agency_id == branch.id,
            User.role == UserRole.MANAGER
        ).count()
        
        employee_count = db.query(User).filter(
            User.agency_id == branch.id,
            User.role.in_([UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
        ).count()
        
        vehicle_count = db.query(Vehicle).filter(Vehicle.agency_id == branch.id).count()
        customer_count = db.query(Customer).filter(Customer.agency_id == branch.id).count()
        
        branch_item = AgencyListItem.model_validate({
            **branch.__dict__,
            'subscription_plan': branch.subscription_plan.value,
            'is_main': False,
            'branch_count': 0,
            'manager_count': manager_count,
            'employee_count': employee_count,
            'vehicle_count': vehicle_count,
            'customer_count': customer_count
        })
        branch_list.append(branch_item)
    
    return ConsolidatedStats(
        main_agency_id=main_agency.id,
        main_agency_name=main_agency.name,
        branch_count=len(branches),
        total_users=total_users,
        total_vehicles=total_vehicles,
        total_customers=total_customers,
        total_bookings=total_bookings,
        total_revenue=total_revenue,
        branches=branch_list
    )


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


# ============ Employee Management (All roles) ============

class EmployeeInfo(BaseModel):
    """Schema for employee information"""
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str]
    role: str
    agency_id: UUID
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class EmployeeCreate(BaseModel):
    """Schema for creating an employee"""
    agency_id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole  # MANAGER, AGENT_COMPTOIR, AGENT_PARC
    password: str


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


@router.get("/agencies/{agency_id}/employees", response_model=List[EmployeeInfo])
async def get_agency_employees(
    agency_id: UUID,
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all employees for a specific agency, optionally filtered by role
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Build query
    query = db.query(User).filter(
        User.agency_id == agency_id,
        User.role.in_([UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
    )
    
    if role:
        query = query.filter(User.role == role)
    
    employees = query.all()
    
    return [EmployeeInfo.model_validate(e) for e in employees]


@router.post("/agencies/{agency_id}/employees", response_model=EmployeeInfo, status_code=status.HTTP_201_CREATED)
async def create_employee(
    agency_id: UUID,
    employee_data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new employee for an agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can create employees"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Verify agency_id matches
    if employee_data.agency_id != agency_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agency ID mismatch"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == employee_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    if employee_data.role not in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be MANAGER, AGENT_COMPTOIR, or AGENT_PARC"
        )
    
    # Create employee
    employee = User(
        email=employee_data.email,
        full_name=employee_data.full_name,
        phone=employee_data.phone,
        hashed_password=get_password_hash(employee_data.password),
        role=employee_data.role,
        agency_id=agency_id,
        is_active=True
    )
    
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    return EmployeeInfo.model_validate(employee)


@router.put("/agencies/{agency_id}/employees/{employee_id}", response_model=EmployeeInfo)
async def update_employee(
    agency_id: UUID,
    employee_id: UUID,
    employee_data: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an employee's information
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can update employees"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Find employee
    employee = db.query(User).filter(
        User.id == employee_id,
        User.agency_id == agency_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in this agency"
        )
    
    # Update fields
    if employee_data.email is not None:
        # Check if new email is already used
        existing = db.query(User).filter(
            User.email == employee_data.email,
            User.id != employee_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        setattr(employee, 'email', employee_data.email)
    
    if employee_data.full_name is not None:
        setattr(employee, 'full_name', employee_data.full_name)
    
    if employee_data.phone is not None:
        setattr(employee, 'phone', employee_data.phone)
    
    if employee_data.role is not None:
        if employee_data.role not in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        setattr(employee, 'role', employee_data.role)
    
    if employee_data.is_active is not None:
        setattr(employee, 'is_active', employee_data.is_active)
    
    db.commit()
    db.refresh(employee)
    
    return EmployeeInfo.model_validate(employee)


@router.delete("/agencies/{agency_id}/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    agency_id: UUID,
    employee_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an employee from an agency
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can delete employees"
        )
    
    # Verify ownership
    verify_agency_ownership(db, agency_id, current_user.id)
    
    # Find employee
    employee = db.query(User).filter(
        User.id == employee_id,
        User.agency_id == agency_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in this agency"
        )
    
    # Delete employee
    db.delete(employee)
    db.commit()
    
    return None


# ============ CLIENT MANAGEMENT WITH RENTAL HISTORY ============

class ClientStats(BaseModel):
    """Client statistics with rental history"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    customer_type: str
    is_blacklisted: bool
    blacklist_reason: Optional[str] = None
    agency_name: str
    total_rentals: int
    total_revenue: float
    last_rental_date: Optional[str] = None
    created_at: str


@router.get("/clients", response_model=List[ClientStats])
async def get_all_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all clients from proprietaire's agencies with rental statistics
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Get all agencies owned by the proprietaire
    agencies = db.query(Agency).filter(Agency.owner_id == current_user.id).all()
    agency_ids = [str(agency.id) for agency in agencies]
    agency_map = {str(agency.id): agency.name for agency in agencies}
    
    if not agency_ids:
        return []
    
    # Get all customers from these agencies
    customers = db.query(Customer).filter(Customer.agency_id.in_(agency_ids)).all()
    
    client_stats_list = []
    for customer in customers:
        # Get rental statistics
        bookings = db.query(Booking).filter(
            Booking.customer_id == customer.id,
            Booking.status.in_(['completed', 'confirmed', 'in_progress'])
        ).all()
        
        total_rentals = len(bookings)
        total_revenue = sum(float(booking.total_amount or 0) for booking in bookings)
        
        # Get last rental date
        last_rental = None
        if bookings:
            last_booking = max(bookings, key=lambda b: b.created_at)
            last_rental = last_booking.created_at.isoformat()
        
        client_stats_list.append(ClientStats(
            id=customer.id,
            first_name=customer.first_name,
            last_name=customer.last_name,
            email=customer.email,
            phone=customer.phone,
            customer_type=customer.customer_type,
            is_blacklisted=customer.is_blacklisted,
            blacklist_reason=customer.blacklist_reason,
            agency_name=agency_map.get(str(customer.agency_id), "Unknown"),
            total_rentals=total_rentals,
            total_revenue=total_revenue,
            last_rental_date=last_rental,
            created_at=customer.created_at.isoformat()
        ))
    
    return client_stats_list


class ClientRentalHistory(BaseModel):
    """Detailed rental history for a client"""
    model_config = ConfigDict(from_attributes=True)
    
    booking_number: str
    vehicle_info: str
    start_date: str
    end_date: str
    duration_days: int
    total_amount: float
    status: str
    payment_status: str
    created_at: str


@router.get("/clients/{client_id}/rentals", response_model=List[ClientRentalHistory])
async def get_client_rental_history(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed rental history for a specific client
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Verify client belongs to proprietaire's agency
    customer = db.query(Customer).filter(Customer.id == client_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    agency = db.query(Agency).filter(
        Agency.id == customer.agency_id,
        Agency.owner_id == current_user.id
    ).first()
    
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client does not belong to your agencies"
        )
    
    # Get all bookings for this customer
    bookings = db.query(Booking).filter(Booking.customer_id == client_id).order_by(Booking.created_at.desc()).all()
    
    rental_history = []
    for booking in bookings:
        # Get vehicle info
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        vehicle_info = f"{vehicle.brand} {vehicle.model}" if vehicle else "Unknown"
        
        rental_history.append(ClientRentalHistory(
            booking_number=booking.booking_number,
            vehicle_info=vehicle_info,
            start_date=booking.start_date.isoformat(),
            end_date=booking.end_date.isoformat(),
            duration_days=booking.duration_days,
            total_amount=float(booking.total_amount),
            status=booking.status,
            payment_status=booking.payment_status,
            created_at=booking.created_at.isoformat()
        ))
    
    return rental_history


class BlacklistUpdate(BaseModel):
    """Update client blacklist status"""
    is_blacklisted: bool
    reason: Optional[str] = None


@router.put("/clients/{client_id}/blacklist")
async def update_client_blacklist(
    client_id: int,
    data: BlacklistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add or remove a client from blacklist
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access this endpoint"
        )
    
    # Verify client belongs to proprietaire's agency
    customer = db.query(Customer).filter(Customer.id == client_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    agency = db.query(Agency).filter(
        Agency.id == customer.agency_id,
        Agency.owner_id == current_user.id
    ).first()
    
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client does not belong to your agencies"
        )
    
    # Update blacklist status
    setattr(customer, 'is_blacklisted', data.is_blacklisted)
    setattr(customer, 'blacklist_reason', data.reason if data.is_blacklisted else None)
    
    db.commit()
    db.refresh(customer)
    
    return {"message": "Client blacklist status updated successfully"}


# ============ CONTRACT CREATION & PDF GENERATION (TUNISIAN LAW) ============

class ContractCreate(BaseModel):
    """Create a rental contract according to Tunisian law"""
    booking_id: int
    lessor_name: str  # Nom du bailleur (agence)
    lessor_address: str
    lessor_tax_id: str  # Matricule fiscal
    lessor_registry: str  # RNE
    lessor_representative: str  # Représentant légal
    
    # Vehicle details
    vehicle_brand: str
    vehicle_model: str
    vehicle_license_plate: str
    vehicle_vin: str
    vehicle_year: int
    vehicle_mileage: int
    
    # Rental terms
    daily_rate: float
    deposit_amount: float
    mileage_limit: Optional[int] = None
    extra_mileage_rate: Optional[float] = None
    
    # Insurance details
    insurance_policy: str
    insurance_coverage: str
    
    # Special conditions
    special_conditions: Optional[str] = None


def generate_contract_pdf(
    contract_data: dict,
    customer: Customer,
    booking: Booking,
) -> BytesIO:
    """
    Generate a rental contract PDF according to Tunisian law
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    
    # Content
    story = []
    
    # Title
    story.append(Paragraph("CONTRAT DE LOCATION DE VÉHICULE", title_style))
    story.append(Paragraph("(Conforme à la législation tunisienne)", normal_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Contract number and date
    story.append(Paragraph(f"<b>Contrat N°:</b> {booking.booking_number}", normal_style))
    story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%d/%m/%Y')}", normal_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Article 1: Parties
    story.append(Paragraph("ARTICLE 1 : LES PARTIES", heading_style))
    story.append(Paragraph("<b>LE BAILLEUR (Loueur):</b>", normal_style))
    story.append(Paragraph(f"Raison sociale: {contract_data['lessor_name']}", normal_style))
    story.append(Paragraph(f"Adresse: {contract_data['lessor_address']}", normal_style))
    story.append(Paragraph(f"Matricule fiscal: {contract_data['lessor_tax_id']}", normal_style))
    story.append(Paragraph(f"Registre de commerce: {contract_data['lessor_registry']}", normal_style))
    story.append(Paragraph(f"Représenté par: {contract_data['lessor_representative']}", normal_style))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("<b>LE PRENEUR (Locataire):</b>", normal_style))
    story.append(Paragraph(f"Nom et prénom: {customer.first_name} {customer.last_name}", normal_style))
    if str(customer.customer_type) == "company":
        story.append(Paragraph(f"Entreprise: {customer.company_name or ''}", normal_style))
        story.append(Paragraph(f"Matricule fiscal: {customer.company_tax_id or ''}", normal_style))
    else:
        story.append(Paragraph(f"CIN: {customer.cin_number or ''}", normal_style))
    story.append(Paragraph(f"Adresse: {customer.address}, {customer.city} {customer.postal_code}", normal_style))
    story.append(Paragraph(f"Téléphone: {customer.phone}", normal_style))
    story.append(Paragraph(f"Email: {customer.email}", normal_style))
    story.append(Paragraph(f"Permis de conduire N°: {customer.license_number}", normal_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Article 2: Object
    story.append(Paragraph("ARTICLE 2 : OBJET DU CONTRAT", heading_style))
    story.append(Paragraph(
        f"Le bailleur loue au preneur le véhicule ci-après désigné:",
        normal_style
    ))
    
    vehicle_data = [
        ['Marque:', contract_data['vehicle_brand']],
        ['Modèle:', contract_data['vehicle_model']],
        ['Immatriculation:', contract_data['vehicle_license_plate']],
        ['N° de châssis:', contract_data['vehicle_vin']],
        ['Année:', str(contract_data['vehicle_year'])],
        ['Kilométrage:', f"{contract_data['vehicle_mileage']} km"],
    ]
    
    vehicle_table = Table(vehicle_data, colWidths=[5*cm, 10*cm])
    vehicle_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e2e8f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(vehicle_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Article 3: Duration
    story.append(Paragraph("ARTICLE 3 : DURÉE DE LA LOCATION", heading_style))
    story.append(Paragraph(
        f"Date de début: <b>{booking.start_date.strftime('%d/%m/%Y')}</b>",
        normal_style
    ))
    story.append(Paragraph(
        f"Date de fin: <b>{booking.end_date.strftime('%d/%m/%Y')}</b>",
        normal_style
    ))
    story.append(Paragraph(
        f"Durée: <b>{booking.duration_days} jour(s)</b>",
        normal_style
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # Article 4: Price
    story.append(Paragraph("ARTICLE 4 : PRIX ET CONDITIONS DE PAIEMENT", heading_style))
    
    price_data = [
        ['Tarif journalier:', f"{contract_data['daily_rate']:.3f} DT"],
        ['Durée:', f"{booking.duration_days} jour(s)"],
        ['Sous-total:', f"{booking.subtotal:.3f} DT"],
        ['TVA (19%):', f"{booking.tax_amount:.3f} DT"],
        ['Timbre fiscal:', f"{booking.timbre_fiscal:.3f} DT"],
        ['<b>TOTAL TTC:</b>', f"<b>{booking.total_amount:.3f} DT</b>"],
        ['Caution (dépôt):', f"{contract_data['deposit_amount']:.3f} DT"],
    ]
    
    price_table = Table(price_data, colWidths=[10*cm, 5*cm])
    price_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, 5), (1, 5), colors.HexColor('#dbeafe')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 5), (1, 5), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(price_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Article 5: Insurance
    story.append(Paragraph("ARTICLE 5 : ASSURANCE", heading_style))
    story.append(Paragraph(
        f"Le véhicule est couvert par une police d'assurance N° <b>{contract_data['insurance_policy']}</b>",
        normal_style
    ))
    story.append(Paragraph(
        f"Couverture: {contract_data['insurance_coverage']}",
        normal_style
    ))
    story.append(Spacer(1, 0.3*cm))
    
    # Article 6: Mileage
    if contract_data.get('mileage_limit'):
        story.append(Paragraph("ARTICLE 6 : KILOMÉTRAGE", heading_style))
        story.append(Paragraph(
            f"Kilométrage inclus: <b>{contract_data['mileage_limit']} km</b>",
            normal_style
        ))
        if contract_data.get('extra_mileage_rate'):
            story.append(Paragraph(
                f"Tarif dépassement: <b>{contract_data['extra_mileage_rate']:.3f} DT/km</b>",
                normal_style
            ))
        story.append(Spacer(1, 0.3*cm))
    
    # Article 7: Obligations
    story.append(Paragraph("ARTICLE 7 : OBLIGATIONS DU PRENEUR", heading_style))
    obligations = [
        "Utiliser le véhicule en bon père de famille",
        "Respecter le Code de la route tunisien",
        "Rendre le véhicule dans l'état où il a été reçu",
        "Ne pas sous-louer le véhicule sans autorisation écrite",
        "Signaler immédiatement tout accident ou panne",
        "Payer les contraventions et infractions",
        "Respecter les limitations de kilométrage",
        "Restituer le véhicule avec le même niveau de carburant"
    ]
    for i, obligation in enumerate(obligations, 1):
        story.append(Paragraph(f"{i}. {obligation}", normal_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Article 8: Special conditions
    if contract_data.get('special_conditions'):
        story.append(Paragraph("ARTICLE 8 : CONDITIONS PARTICULIÈRES", heading_style))
        story.append(Paragraph(contract_data['special_conditions'], normal_style))
        story.append(Spacer(1, 0.3*cm))
    
    # Article 9: Jurisdiction
    story.append(Paragraph("ARTICLE 9 : JURIDICTION", heading_style))
    story.append(Paragraph(
        "Tout litige relatif à l'exécution du présent contrat sera soumis à la compétence "
        "exclusive des tribunaux tunisiens.",
        normal_style
    ))
    story.append(Spacer(1, 1*cm))
    
    # Signatures
    story.append(Paragraph("Fait à _________________, le ________________", normal_style))
    story.append(Spacer(1, 1*cm))
    
    signature_data = [
        ['Le Bailleur', 'Le Preneur'],
        ['(Signature et cachet)', '(Signature et mention "Lu et approuvé")'],
        ['', ''],
        ['', ''],
    ]
    
    signature_table = Table(signature_data, colWidths=[8*cm, 8*cm])
    signature_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ]))
    story.append(signature_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


@router.post("/contracts/generate-pdf")
async def generate_rental_contract(
    contract_data: ContractCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a rental contract PDF according to Tunisian law
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can generate contracts"
        )
    
    # Get booking
    booking = db.query(Booking).filter(Booking.id == contract_data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify agency ownership
    agency = db.query(Agency).filter(
        Agency.id == booking.agency_id,
        Agency.owner_id == current_user.id
    ).first()
    
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Booking does not belong to your agencies"
        )
    
    # Get customer
    customer = db.query(Customer).filter(Customer.id == booking.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Generate PDF
    pdf_buffer = generate_contract_pdf(
        contract_data.model_dump(),
        customer,
        booking
    )
    
    # Return PDF as download
    filename = f"Contrat_{booking.booking_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


class ContractInfo(BaseModel):
    """Contract information for list view"""
    model_config = ConfigDict(from_attributes=True)
    
    booking_id: int
    booking_number: str
    customer_name: str
    vehicle_info: str
    start_date: str
    end_date: str
    total_amount: float
    status: str


@router.get("/contracts", response_model=List[ContractInfo])
async def get_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all rental contracts from proprietaire's agencies
    """
    if str(current_user.role) != str(UserRole.PROPRIETAIRE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only proprietaires can access contracts"
        )
    
    # Get all agencies owned by the proprietaire
    agencies = db.query(Agency).filter(Agency.owner_id == current_user.id).all()
    agency_ids = [str(agency.id) for agency in agencies]
    
    if not agency_ids:
        return []
    
    # Get all confirmed/completed bookings
    bookings = db.query(Booking).filter(
        Booking.agency_id.in_(agency_ids),
        Booking.status.in_(['confirmed', 'in_progress', 'completed'])
    ).order_by(Booking.created_at.desc()).all()
    
    contracts = []
    for booking in bookings:
        # Get customer
        customer = db.query(Customer).filter(Customer.id == booking.customer_id).first()
        customer_name = f"{customer.first_name} {customer.last_name}" if customer else "Unknown"
        
        # Get vehicle
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        vehicle_info = f"{vehicle.brand} {vehicle.model}" if vehicle else "Unknown"
        
        contracts.append(ContractInfo(
            booking_id=booking.id,
            booking_number=booking.booking_number,
            customer_name=customer_name,
            vehicle_info=vehicle_info,
            start_date=booking.start_date.isoformat(),
            end_date=booking.end_date.isoformat(),
            total_amount=float(booking.total_amount),
            status=booking.status
        ))
    
    return contracts
