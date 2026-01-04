"""
Customer Management endpoints
Allows managing customers (individuals and companies)
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_agency_access
from app.models.user import User, UserRole
from app.models.agency import Agency
from app.models.customer import Customer, CustomerType
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse


router = APIRouter(prefix="/customers", tags=["Customer Management"])


@router.get("/", response_model=List[CustomerResponse])
async def list_customers(
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    customer_type: Optional[CustomerType] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all customers
    
    Role-based access:
    - Manager/Employees: Auto-use their assigned agency
    - Proprietaire/Super Admin: Must provide agency_id parameter
    """
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:  # type: ignore
        if not current_user.agency_id:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id  # type: ignore
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify agency access
    verify_agency_access(current_user, target_agency_id, db)
    
    query = db.query(Customer).filter(Customer.agency_id == target_agency_id)
    
    # Apply filters
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)
    
    if search:
        query = query.filter(
            (Customer.first_name.ilike(f"%{search}%")) |
            (Customer.last_name.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%")) |
            (Customer.cin_number.ilike(f"%{search}%")) |
            (Customer.company_name.ilike(f"%{search}%"))
        )
    
    # Pagination
    customers = query.offset(skip).limit(limit).all()
    
    return customers


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific customer by ID
    
    Role-based access:
    - Automatically verifies user has access to the customer's agency
    """
    # Get customer first to determine its agency
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Verify access to the customer's agency
    verify_agency_access(current_user, customer.agency_id, db)
    
    return customer


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new customer
    
    Role-based access:
    - Manager/Employees: Can create customers in their assigned agency
    - Proprietaire/Super Admin: Must provide agency_id parameter
    """
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:  # type: ignore
        if not current_user.agency_id:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id  # type: ignore
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify agency access
    verify_agency_access(current_user, target_agency_id, db)
    
    # Check if CIN already exists (if provided)
    if customer_data.cin_number:
        existing = db.query(Customer).filter(
            Customer.cin_number == customer_data.cin_number,
            Customer.agency_id == target_agency_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A customer with this CIN number already exists"
            )
    
    # Check if company tax ID already exists (if provided)
    if customer_data.company_tax_id:
        existing = db.query(Customer).filter(
            Customer.company_tax_id == customer_data.company_tax_id,
            Customer.agency_id == target_agency_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A company with this tax ID already exists"
            )
    
    # Create customer
    customer = Customer(
        **customer_data.model_dump(),
        agency_id=target_agency_id
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a customer
    
    Role-based access:
    - Automatically verifies user has access to the customer's agency
    """
    # Get customer first to determine its agency
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Verify access to the customer's agency
    verify_agency_access(current_user, customer.agency_id, db)
    
    # Update fields
    update_data = customer_data.model_dump(exclude_unset=True)
    
    # Check CIN uniqueness if being changed
    if "cin_number" in update_data and update_data["cin_number"] != customer.cin_number:
        existing = db.query(Customer).filter(
            Customer.cin_number == update_data["cin_number"],
            Customer.agency_id == customer.agency_id,
            Customer.id != customer_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A customer with this CIN number already exists"
            )
    
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a customer
    
    Role-based access:
    - Automatically verifies user has access to the customer's agency
    - Only MANAGER and above can delete customers
    
    Note: Will fail if customer has active bookings
    """
    # Check role permission
    if current_user.role not in [UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN]:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and above can delete customers"
        )
    
    from app.models.booking import Booking
    
    # Get customer first to determine its agency
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Verify access to the customer's agency
    verify_agency_access(current_user, customer.agency_id, db)
    
    # Check for active bookings
    active_bookings = db.query(Booking).filter(
        Booking.customer_id == customer_id,
        Booking.status.in_(['pending', 'confirmed', 'active'])
    ).count()
    
    if active_bookings > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete this customer because they have {active_bookings} active booking(s)"
        )
    
    db.delete(customer)
    db.commit()
    
    return None


@router.get("/stats/summary", response_model=dict)
async def get_customers_stats(
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get customer statistics
    
    Role-based access:
    - Manager/Employees: Auto-use their assigned agency
    - Proprietaire/Super Admin: Must provide agency_id parameter
    """
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:  # type: ignore
        if not current_user.agency_id:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id  # type: ignore
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify agency access
    verify_agency_access(current_user, target_agency_id, db)
    
    total_customers = db.query(Customer).filter(Customer.agency_id == target_agency_id).count()
    
    individuals = db.query(Customer).filter(
        Customer.agency_id == target_agency_id,
        Customer.customer_type == CustomerType.INDIVIDUAL
    ).count()
    
    companies = db.query(Customer).filter(
        Customer.agency_id == target_agency_id,
        Customer.customer_type == CustomerType.COMPANY
    ).count()
    
    return {
        "total_customers": total_customers,
        "individuals": individuals,
        "companies": companies
    }
