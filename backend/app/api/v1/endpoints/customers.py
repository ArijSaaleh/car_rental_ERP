"""
Customer Management endpoints
Allows managing customers (individuals and companies)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_tenant
from app.models.user import User
from app.models.agency import Agency
from app.models.customer import Customer, CustomerType
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse


router = APIRouter(prefix="/customers", tags=["Customer Management"])


@router.get("/", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    customer_type: Optional[CustomerType] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    List all customers for the current agency
    
    Accessible par: All authenticated users
    """
    query = db.query(Customer).filter(Customer.agency_id == agency.id)
    
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
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get a specific customer by ID
    
    Accessible par: All authenticated users
    """
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.agency_id == agency.id
    ).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client non trouvé"
        )
    
    return customer


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Create a new customer
    
    Accessible par: All authenticated users
    """
    # Check if CIN already exists (if provided)
    if customer_data.cin_number:
        existing = db.query(Customer).filter(
            Customer.cin_number == customer_data.cin_number,
            Customer.agency_id == agency.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un client avec ce numéro CIN existe déjà"
            )
    
    # Check if company tax ID already exists (if provided)
    if customer_data.company_tax_id:
        existing = db.query(Customer).filter(
            Customer.company_tax_id == customer_data.company_tax_id,
            Customer.agency_id == agency.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une entreprise avec ce matricule fiscal existe déjà"
            )
    
    # Create customer
    customer = Customer(
        **customer_data.model_dump(),
        agency_id=agency.id
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
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Update a customer
    
    Accessible par: All authenticated users
    """
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.agency_id == agency.id
    ).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client non trouvé"
        )
    
    # Update fields
    update_data = customer_data.model_dump(exclude_unset=True)
    
    # Check CIN uniqueness if being changed
    if "cin_number" in update_data and update_data["cin_number"] != customer.cin_number:
        existing = db.query(Customer).filter(
            Customer.cin_number == update_data["cin_number"],
            Customer.agency_id == agency.id,
            Customer.id != customer_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un client avec ce numéro CIN existe déjà"
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
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Delete a customer
    
    Accessible par: PROPRIETAIRE, MANAGER
    
    Note: Will fail if customer has active bookings
    """
    from app.models.booking import Booking
    
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.agency_id == agency.id
    ).first()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client non trouvé"
        )
    
    # Check for active bookings
    active_bookings = db.query(Booking).filter(
        Booking.customer_id == customer_id,
        Booking.status.in_(['pending', 'confirmed', 'active'])
    ).count()
    
    if active_bookings > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer ce client car il a {active_bookings} réservation(s) active(s)"
        )
    
    db.delete(customer)
    db.commit()
    
    return None


@router.get("/stats/summary", response_model=dict)
async def get_customers_stats(
    current_user: User = Depends(get_current_user),
    agency: Agency = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get customer statistics
    
    Accessible par: All authenticated users
    """
    total_customers = db.query(Customer).filter(Customer.agency_id == agency.id).count()
    
    individuals = db.query(Customer).filter(
        Customer.agency_id == agency.id,
        Customer.customer_type == CustomerType.INDIVIDUAL
    ).count()
    
    companies = db.query(Customer).filter(
        Customer.agency_id == agency.id,
        Customer.customer_type == CustomerType.COMPANY
    ).count()
    
    return {
        "total_customers": total_customers,
        "individuals": individuals,
        "companies": companies
    }
