"""
Booking endpoints for reservation management
"""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, check_permission, verify_agency_access
from app.models.user import User, UserRole
from app.models.agency import Agency
from uuid import UUID
from app.models.booking import Booking, BookingStatus
from app.models.vehicle import Vehicle
from app.services.booking_service import BookingService
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    VehicleAvailabilityRequest,
    VehicleAvailabilityResponse
)

router = APIRouter()


@router.post("/check-availability", response_model=VehicleAvailabilityResponse)
async def check_vehicle_availability(
    request: VehicleAvailabilityRequest,
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check vehicle availability for a given period
    
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
    
    is_available = BookingService.check_vehicle_availability(
        db=db,
        vehicle_id=request.vehicle_id,
        start_date=request.start_date,
        end_date=request.end_date,
        agency_id=target_agency_id
    )
    
    conflicts = []
    if not is_available:
        conflicts = BookingService.get_conflicting_bookings(
            db=db,
            vehicle_id=request.vehicle_id,
            start_date=request.start_date,
            end_date=request.end_date,
            agency_id=target_agency_id
        )
    
    # Calculate price if available
    pricing = None
    if is_available:
        pricing = BookingService.calculate_rental_price(
            db=db,
            vehicle_id=request.vehicle_id,
            start_date=request.start_date,
            end_date=request.end_date,
            agency_id=target_agency_id
        )
    
    return VehicleAvailabilityResponse(
        available=is_available,
        vehicle_id=request.vehicle_id,
        start_date=request.start_date,
        end_date=request.end_date,
        conflicts=[
            {
                "booking_number": c.booking_number,
                "start_date": c.start_date,
                "end_date": c.end_date,
                "status": c.status
            }
            for c in conflicts
        ],
        pricing=pricing
    )


@router.get("/available-vehicles", response_model=List[dict])
async def get_available_vehicles(
    start_date: date = Query(...),
    end_date: date = Query(...),
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    brand: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    transmission: Optional[str] = Query(None),
    min_seats: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all available vehicles for a given period with optional filters
    
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
    
    filters = {}
    if brand:
        filters["brand"] = brand
    if fuel_type:
        filters["fuel_type"] = fuel_type
    if transmission:
        filters["transmission"] = transmission
    if min_seats:
        filters["min_seats"] = min_seats
    
    vehicles = BookingService.get_available_vehicles(
        db=db,
        agency_id=target_agency_id,
        start_date=start_date,
        end_date=end_date,
        filters=filters if filters else None
    )
    
    return [
        {
            "id": v.id,
            "brand": v.brand,
            "model": v.model,
            "license_plate": v.license_plate,
            "year": v.year,
            "fuel_type": v.fuel_type,
            "transmission": v.transmission,
            "seats": v.seats,
            "daily_rate": float(v.daily_rate)
        }
        for v in vehicles
    ]


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new booking
    
    Role-based access:
    - Manager/Employees: Can create bookings in their assigned agency
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
    
    # Check availability
    is_available = BookingService.check_vehicle_availability(
        db=db,
        vehicle_id=booking_data.vehicle_id,
        start_date=booking_data.start_date,
        end_date=booking_data.end_date,
        agency_id=target_agency_id
    )
    
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is not available for this period"
        )
    
    # Calculate price
    pricing = BookingService.calculate_rental_price(
        db=db,
        vehicle_id=booking_data.vehicle_id,
        start_date=booking_data.start_date,
        end_date=booking_data.end_date,
        agency_id=target_agency_id,
        daily_rate=booking_data.daily_rate
    )
    
    # Generate booking number
    booking_number = BookingService.generate_booking_number(db, target_agency_id)
    
    # Create booking
    new_booking = Booking(
        booking_number=booking_number,
        agency_id=target_agency_id,
        vehicle_id=booking_data.vehicle_id,
        customer_id=booking_data.customer_id,
        created_by_user_id=current_user.id,
        start_date=booking_data.start_date,
        end_date=booking_data.end_date,
        daily_rate=booking_data.daily_rate or pricing["daily_rate"],
        duration_days=pricing["duration_days"],
        subtotal=pricing["subtotal"],
        tax_amount=pricing["tax_amount"],
        timbre_fiscal=pricing["timbre_fiscal"],
        total_amount=pricing["total_amount"],
        deposit_amount=booking_data.deposit_amount or 0.0,
        mileage_limit=booking_data.mileage_limit,
        extra_mileage_rate=booking_data.extra_mileage_rate,
        fuel_policy=booking_data.fuel_policy or "full_to_full",
        notes=booking_data.notes
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    status_filter: Optional[str] = Query(None),
    vehicle_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all bookings with filters
    
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
    
    query = db.query(Booking).filter(Booking.agency_id == target_agency_id)
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if vehicle_id:
        query = query.filter(Booking.vehicle_id == vehicle_id)
    if customer_id:
        query = query.filter(Booking.customer_id == customer_id)
    
    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich bookings with customer and vehicle information
    from app.models.customer import Customer
    from app.models.vehicle import Vehicle
    
    enriched_bookings = []
    for booking in bookings:
        booking_dict = {
            "id": booking.id,
            "booking_number": booking.booking_number,
            "agency_id": booking.agency_id,
            "vehicle_id": booking.vehicle_id,
            "customer_id": booking.customer_id,
            "created_by_user_id": booking.created_by_user_id,
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "pickup_datetime": booking.pickup_datetime,
            "return_datetime": booking.return_datetime,
            "daily_rate": booking.daily_rate,
            "duration_days": booking.duration_days,
            "subtotal": booking.subtotal,
            "tax_amount": booking.tax_amount,
            "timbre_fiscal": booking.timbre_fiscal,
            "total_amount": booking.total_amount,
            "deposit_amount": booking.deposit_amount,
            "status": booking.status,
            "payment_status": booking.payment_status,
            "initial_mileage": booking.initial_mileage,
            "final_mileage": booking.final_mileage,
            "mileage_limit": booking.mileage_limit,
            "extra_mileage_rate": booking.extra_mileage_rate,
            "initial_fuel_level": booking.initial_fuel_level,
            "final_fuel_level": booking.final_fuel_level,
            "fuel_policy": booking.fuel_policy,
            "notes": booking.notes,
            "cancellation_reason": booking.cancellation_reason,
            "created_at": booking.created_at,
            "updated_at": booking.updated_at,
        }
        
        # Get customer info
        customer = db.query(Customer).filter(Customer.id == booking.customer_id).first()
        if customer:
            booking_dict["customer"] = {
                "id": customer.id,
                "first_name": customer.first_name,
                "last_name": customer.last_name,
                "email": customer.email,
                "phone": customer.phone,
                "cin_number": customer.cin_number,
            }
        
        # Get vehicle info
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if vehicle:
            booking_dict["vehicle"] = {
                "id": str(vehicle.id),
                "license_plate": vehicle.license_plate,
                "brand": vehicle.brand,
                "model": vehicle.model,
                "year": vehicle.year,
                "status": vehicle.status.value if hasattr(vehicle.status, 'value') else vehicle.status,
                "daily_rate": vehicle.daily_rate,
            }
        
        enriched_bookings.append(booking_dict)
    
    return enriched_bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific booking
    
    Role-based access:
    - Automatically verifies user has access to the booking's agency
    """
    # Get booking first to determine its agency
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify access to the booking's agency
    verify_agency_access(current_user, booking.agency_id, db)
    
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a booking
    
    Role-based access:
    - Automatically verifies user has access to the booking's agency
    """
    # Get booking first to determine its agency
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify access to the booking's agency
    verify_agency_access(current_user, booking.agency_id, db)
    
    # If dates are modified, check availability
    if booking_update.start_date or booking_update.end_date:
        new_start = booking_update.start_date or booking.start_date
        new_end = booking_update.end_date or booking.end_date
        
        is_available = BookingService.check_vehicle_availability(
            db=db,
            vehicle_id=booking.vehicle_id,
            start_date=new_start,
            end_date=new_end,
            agency_id=booking.agency_id,
            exclude_booking_id=booking_id
        )
        
        if not is_available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vehicle is not available for this new period"
            )
    
    # Mise à jour des champs
    update_data = booking_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(booking, field, value)
    
    db.commit()
    db.refresh(booking)
    
    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(check_permission(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Cancel a booking (soft delete)
    
    Role-based access:
    - Only MANAGER and above can cancel bookings
    - Automatically verifies access to booking's agency
    """
    # Get booking first to determine its agency
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify access to the booking's agency
    verify_agency_access(current_user, booking.agency_id, db)
    
    booking.status = BookingStatus.CANCELLED
    db.commit()
    
    return None


@router.get("/vehicle/{vehicle_id}/calendar")
async def get_vehicle_calendar(
    vehicle_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get booking calendar for a vehicle
    
    Role-based access:
    - Automatically verifies user has access to the vehicle's agency
    """
    # Get vehicle first to determine its agency
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Verify access to the vehicle's agency
    verify_agency_access(current_user, vehicle.agency_id, db)
    
    calendar = BookingService.get_vehicle_calendar(
        db=db,
        vehicle_id=vehicle_id,
        agency_id=vehicle.agency_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return {"vehicle_id": vehicle_id, "events": calendar}
