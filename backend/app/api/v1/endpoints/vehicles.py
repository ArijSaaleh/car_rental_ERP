from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_agency_access
from app.models.user import User, UserRole
from app.models.agency import Agency
from app.models.vehicle import VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleListResponse
from app.services.vehicle import VehicleService
from app.middleware.feature_flags import FeatureFlags


router = APIRouter(prefix="/vehicles", tags=["Fleet Management"])


@router.get("/", response_model=VehicleListResponse)
async def list_vehicles(
    agency_id: Optional[UUID] = Query(None, description="Agency ID (required for managers/employees, optional for super admin/proprietaire)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vehicle_status: Optional[VehicleStatus] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all vehicles with pagination and filtering
    
    Role-based access:
    - SUPER_ADMIN: Can view vehicles from any agency (requires agency_id parameter)
    - PROPRIETAIRE: Can view vehicles from agencies they own (requires agency_id parameter)
    - MANAGER/Employees: Can only view vehicles from their assigned agency
    
    Requires: Fleet Management feature (available in all plans)
    """
    # Determine target agency
    target_agency_id = agency_id
    
    # Managers and employees must use their own agency
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
        if not current_user.agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id
    else:
        # Proprietaire and super admin must specify agency
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify agency access
    verify_agency_access(current_user, target_agency_id, db)
    
    # Get agency and verify feature access
    agency = db.query(Agency).filter(Agency.id == target_agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    skip = (page - 1) * page_size
    
    vehicles, total = VehicleService.get_vehicles(
        db=db,
        agency_id=target_agency_id,
        skip=skip,
        limit=page_size,
        status=vehicle_status,
        brand=brand,
        search=search
    )
    
    # Enrich vehicles with current booking information
    from app.models.booking import Booking, BookingStatus
    from app.models.customer import Customer
    from app.schemas.vehicle import CurrentBookingInfo
    
    enriched_vehicles = []
    for vehicle in vehicles:
        vehicle_dict = {
            "id": vehicle.id,
            "license_plate": vehicle.license_plate,
            "vin": vehicle.vin,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "year": vehicle.year,
            "color": vehicle.color,
            "fuel_type": vehicle.fuel_type,
            "transmission": vehicle.transmission,
            "seats": vehicle.seats,
            "doors": vehicle.doors,
            "mileage": vehicle.mileage,
            "status": vehicle.status,
            "registration_number": vehicle.registration_number,
            "insurance_policy": vehicle.insurance_policy,
            "insurance_expiry": vehicle.insurance_expiry,
            "technical_control_expiry": vehicle.technical_control_expiry,
            "daily_rate": vehicle.daily_rate,
            "notes": vehicle.notes,
            "agency_id": vehicle.agency_id,
            "created_at": vehicle.created_at,
            "updated_at": vehicle.updated_at,
            "current_booking": None
        }
        
        # Get active booking for this vehicle
        active_booking = db.query(Booking).join(Customer).filter(
            Booking.vehicle_id == vehicle.id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        ).first()
        
        if active_booking:
            customer = db.query(Customer).filter(Customer.id == active_booking.customer_id).first()
            if customer:
                vehicle_dict["current_booking"] = {
                    "id": active_booking.id,
                    "booking_number": active_booking.booking_number,
                    "customer_name": f"{customer.first_name} {customer.last_name}",
                    "customer_phone": customer.phone,
                    "start_date": active_booking.start_date,
                    "end_date": active_booking.end_date,
                    "status": active_booking.status
                }
        
        enriched_vehicles.append(vehicle_dict)
    
    return {
        "total": total,
        "vehicles": enriched_vehicles,
        "page": page,
        "page_size": page_size
    }


@router.get("/stats")
async def get_vehicle_stats(
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get vehicle statistics
    
    Role-based access:
    - SUPER_ADMIN/PROPRIETAIRE: Specify agency_id parameter
    - MANAGER/Employees: Automatically uses their assigned agency
    
    Requires: Fleet Management feature
    """
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:
        if not current_user.agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify access
    verify_agency_access(current_user, target_agency_id, db)
    
    # Get agency
    agency = db.query(Agency).filter(Agency.id == target_agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    stats = VehicleService.get_vehicle_stats(db, target_agency_id)
    return stats


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific vehicle by ID
    
    Role-based access:
    - Automatically verifies user has access to the vehicle's agency
    
    Requires: Fleet Management feature
    """
    # Get the vehicle first to determine its agency
    from app.models.vehicle import Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Verify access to the vehicle's agency
    verify_agency_access(current_user, vehicle.agency_id, db)
    
    # Get agency and check feature
    agency = db.query(Agency).filter(Agency.id == vehicle.agency_id).first()
    if agency:
        FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    return vehicle


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new vehicle
    
    Role-based access:
    - MANAGER/Employees: Can only create in their assigned agency
    - PROPRIETAIRE: Can create in agencies they own (requires agency_id)
    - SUPER_ADMIN: Can create in any agency (requires agency_id)
    
    Requires: Fleet Management feature, MANAGER role or higher
    """
    # Only MANAGER and above can create vehicles
    if current_user.role not in [UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and above can create vehicles"
        )
    
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role == UserRole.MANAGER:
        if not current_user.agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify access
    verify_agency_access(current_user, target_agency_id, db)
    
    # Get agency
    agency = db.query(Agency).filter(Agency.id == target_agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    vehicle = VehicleService.create_vehicle(db, vehicle_data, target_agency_id)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: UUID,
    vehicle_data: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a vehicle
    
    Role-based access:
    - Automatically verifies user has access to the vehicle's agency
    - Only MANAGER and above can update vehicles
    
    Requires: Fleet Management feature
    """
    # Only MANAGER and above can update vehicles
    if current_user.role not in [UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and above can update vehicles"
        )
    
    # Get the vehicle to verify agency access
    from app.models.vehicle import Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Verify access
    verify_agency_access(current_user, vehicle.agency_id, db)
    
    # Get agency and check feature
    agency = db.query(Agency).filter(Agency.id == vehicle.agency_id).first()
    if agency:
        FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    updated_vehicle = VehicleService.update_vehicle(db, vehicle_id, vehicle_data, vehicle.agency_id)
    return updated_vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a vehicle
    
    Role-based access:
    - Automatically verifies user has access to the vehicle's agency
    - Only MANAGER and above can delete vehicles
    
    Requires: Fleet Management feature
    """
    # Only MANAGER and above can delete vehicles
    if current_user.role not in [UserRole.MANAGER, UserRole.PROPRIETAIRE, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and above can delete vehicles"
        )
    
    # Get the vehicle to verify agency access
    from app.models.vehicle import Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Verify access
    verify_agency_access(current_user, vehicle.agency_id, db)
    
    # Get agency and check feature
    agency = db.query(Agency).filter(Agency.id == vehicle.agency_id).first()
    if agency:
        FeatureFlags.require_feature(agency, FeatureFlags.FLEET_MANAGEMENT)
    
    VehicleService.delete_vehicle(db, vehicle_id, vehicle.agency_id)
    return None
