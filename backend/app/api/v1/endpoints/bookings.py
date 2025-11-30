"""
Booking endpoints for reservation management
"""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, check_permission
from app.models.user import User, UserRole
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Vérifie la disponibilité d'un véhicule pour une période donnée
    """
    is_available = BookingService.check_vehicle_availability(
        db=db,
        vehicle_id=request.vehicle_id,
        start_date=request.start_date,
        end_date=request.end_date,
        agency_id=current_user.agency_id
    )
    
    conflicts = []
    if not is_available:
        conflicts = BookingService.get_conflicting_bookings(
            db=db,
            vehicle_id=request.vehicle_id,
            start_date=request.start_date,
            end_date=request.end_date,
            agency_id=current_user.agency_id
        )
    
    # Calcul du prix si disponible
    pricing = None
    if is_available:
        pricing = BookingService.calculate_rental_price(
            db=db,
            vehicle_id=request.vehicle_id,
            start_date=request.start_date,
            end_date=request.end_date,
            agency_id=current_user.agency_id
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
    brand: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    transmission: Optional[str] = Query(None),
    min_seats: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère tous les véhicules disponibles pour une période donnée avec filtres optionnels
    """
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
        agency_id=current_user.agency_id,
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle réservation
    Accessible par: proprietaire, manager, employee
    """
    # Vérifier la disponibilité
    is_available = BookingService.check_vehicle_availability(
        db=db,
        vehicle_id=booking_data.vehicle_id,
        start_date=booking_data.start_date,
        end_date=booking_data.end_date,
        agency_id=current_user.agency_id
    )
    
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le véhicule n'est pas disponible pour cette période"
        )
    
    # Calculer le prix
    pricing = BookingService.calculate_rental_price(
        db=db,
        vehicle_id=booking_data.vehicle_id,
        start_date=booking_data.start_date,
        end_date=booking_data.end_date,
        agency_id=current_user.agency_id,
        daily_rate=booking_data.daily_rate
    )
    
    # Générer le numéro de réservation
    booking_number = BookingService.generate_booking_number(db, current_user.agency_id)
    
    # Créer la réservation
    new_booking = Booking(
        booking_number=booking_number,
        agency_id=current_user.agency_id,
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
    status_filter: Optional[str] = Query(None),
    vehicle_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Liste toutes les réservations de l'agence avec filtres
    """
    query = db.query(Booking).filter(Booking.agency_id == current_user.agency_id)
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if vehicle_id:
        query = query.filter(Booking.vehicle_id == vehicle_id)
    if customer_id:
        query = query.filter(Booking.customer_id == customer_id)
    
    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère une réservation spécifique
    """
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.agency_id == current_user.agency_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour une réservation
    """
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.agency_id == current_user.agency_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    
    # Si modification des dates, vérifier disponibilité
    if booking_update.start_date or booking_update.end_date:
        new_start = booking_update.start_date or booking.start_date
        new_end = booking_update.end_date or booking.end_date
        
        is_available = BookingService.check_vehicle_availability(
            db=db,
            vehicle_id=booking.vehicle_id,
            start_date=new_start,
            end_date=new_end,
            agency_id=current_user.agency_id,
            exclude_booking_id=booking_id
        )
        
        if not is_available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Le véhicule n'est pas disponible pour cette nouvelle période"
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
    Annule une réservation (soft delete)
    Accessible par: manager et au-dessus
    """
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.agency_id == current_user.agency_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    
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
    Récupère le calendrier de réservations d'un véhicule
    """
    calendar = BookingService.get_vehicle_calendar(
        db=db,
        vehicle_id=vehicle_id,
        agency_id=current_user.agency_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return {"vehicle_id": vehicle_id, "events": calendar}
