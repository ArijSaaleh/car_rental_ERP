"""
Booking service with availability check and conflict detection
"""
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.booking import Booking, BookingStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.core.database import get_db


class BookingService:
    """
    Service pour gérer les réservations et la disponibilité des véhicules
    """
    
    @staticmethod
    def check_vehicle_availability(
        db: Session,
        vehicle_id: UUID,
        start_date: date,
        end_date: date,
        agency_id: UUID,
        exclude_booking_id: Optional[int] = None
    ) -> bool:
        """
        Vérifie si un véhicule est disponible pour une période donnée
        
        Args:
            vehicle_id: ID du véhicule
            start_date: Date de début
            end_date: Date de fin
            agency_id: ID de l'agence (multi-tenant)
            exclude_booking_id: ID de réservation à exclure (pour modification)
        
        Returns:
            True si disponible, False sinon
        """
        # Vérifier que le véhicule existe et appartient à l'agence
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == vehicle_id,
            Vehicle.agency_id == agency_id
        ).first()
        
        if not vehicle:
            return False
        
        # Vérifier l'état du véhicule
        if vehicle.status not in [VehicleStatus.DISPONIBLE]:
            return False
        
        # Construire la requête de conflit
        conflict_query = db.query(Booking).filter(
            Booking.vehicle_id == vehicle_id,
            Booking.agency_id == agency_id,
            Booking.status.in_([
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
                BookingStatus.PENDING
            ]),
            # Détection de chevauchement de dates
            or_(
                and_(Booking.start_date <= start_date, Booking.end_date >= start_date),
                and_(Booking.start_date <= end_date, Booking.end_date >= end_date),
                and_(Booking.start_date >= start_date, Booking.end_date <= end_date)
            )
        )
        
        # Exclure une réservation spécifique (utile pour les modifications)
        if exclude_booking_id:
            conflict_query = conflict_query.filter(Booking.id != exclude_booking_id)
        
        conflicting_bookings = conflict_query.count()
        
        return conflicting_bookings == 0
    
    @staticmethod
    def get_conflicting_bookings(
        db: Session,
        vehicle_id: UUID,
        start_date: date,
        end_date: date,
        agency_id: UUID
    ) -> List[Booking]:
        """
        Récupère toutes les réservations en conflit avec la période demandée
        """
        return db.query(Booking).filter(
            Booking.vehicle_id == vehicle_id,
            Booking.agency_id == agency_id,
            Booking.status.in_([
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
                BookingStatus.PENDING
            ]),
            or_(
                and_(Booking.start_date <= start_date, Booking.end_date >= start_date),
                and_(Booking.start_date <= end_date, Booking.end_date >= end_date),
                and_(Booking.start_date >= start_date, Booking.end_date <= end_date)
            )
        ).all()
    
    @staticmethod
    def get_available_vehicles(
        db: Session,
        agency_id: UUID,
        start_date: date,
        end_date: date,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Vehicle]:
        """
        Récupère tous les véhicules disponibles pour une période donnée
        
        Args:
            agency_id: ID de l'agence
            start_date: Date de début
            end_date: Date de fin
            filters: Filtres optionnels (brand, fuel_type, transmission, etc.)
        """
        # Récupérer tous les véhicules disponibles de l'agence
        query = db.query(Vehicle).filter(
            Vehicle.agency_id == agency_id,
            Vehicle.status == VehicleStatus.DISPONIBLE
        )
        
        # Appliquer les filtres optionnels
        if filters:
            if filters.get("brand"):
                query = query.filter(Vehicle.brand == filters["brand"])
            if filters.get("fuel_type"):
                query = query.filter(Vehicle.fuel_type == filters["fuel_type"])
            if filters.get("transmission"):
                query = query.filter(Vehicle.transmission == filters["transmission"])
            if filters.get("min_seats"):
                query = query.filter(Vehicle.seats >= filters["min_seats"])
        
        all_vehicles = query.all()
        
        # Filtrer les véhicules avec des réservations en conflit
        available_vehicles = []
        for vehicle in all_vehicles:
            if BookingService.check_vehicle_availability(
                db, vehicle.id, start_date, end_date, agency_id
            ):
                available_vehicles.append(vehicle)
        
        return available_vehicles
    
    @staticmethod
    def calculate_rental_price(
        db: Session,
        vehicle_id: UUID,
        start_date: date,
        end_date: date,
        agency_id: UUID,
        daily_rate: Optional[float] = None
    ) -> Dict[str, float]:
        """
        Calcule le prix de location pour une période donnée
        
        Returns:
            Dict avec subtotal, tax, timbre_fiscal, total
        """
        # Calculer le nombre de jours
        duration = (end_date - start_date).days
        if duration <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La date de fin doit être après la date de début"
            )
        
        # Utiliser le tarif fourni ou le tarif du véhicule
        if daily_rate is None:
            vehicle = db.query(Vehicle).filter(
                Vehicle.id == vehicle_id,
                Vehicle.agency_id == agency_id
            ).first()
            if not vehicle:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Véhicule non trouvé"
                )
            daily_rate = float(getattr(vehicle, 'daily_rate'))
        
        # Calculs financiers (Tunisie)
        subtotal = daily_rate * duration
        tax_amount = 0.0  # TVA si applicable (19% en Tunisie pour les entreprises)
        timbre_fiscal = 0.600  # Timbre fiscal obligatoire en Tunisie
        total = subtotal + tax_amount + timbre_fiscal
        
        return {
            "duration_days": duration,
            "daily_rate": daily_rate,
            "subtotal": round(subtotal, 3),
            "tax_amount": round(tax_amount, 3),
            "timbre_fiscal": round(timbre_fiscal, 3),
            "total_amount": round(total, 3)
        }
    
    @staticmethod
    def generate_booking_number(db: Session, agency_id: UUID) -> str:
        """
        Génère un numéro de réservation unique
        Format: RES-YYYYMMDD-XXXX
        """
        today = datetime.now().strftime("%Y%m%d")
        
        # Trouver le prochain numéro de séquence disponible
        max_attempts = 1000
        for attempt in range(1, max_attempts + 1):
            sequence = str(attempt).zfill(4)
            booking_number = f"RES-{today}-{sequence}"
            
            # Vérifier si ce numéro existe déjà
            existing = db.query(Booking).filter(
                Booking.booking_number == booking_number
            ).first()
            
            if not existing:
                return booking_number
        
        # Si on arrive ici après 1000 tentatives, utiliser un UUID
        import uuid
        return f"RES-{today}-{str(uuid.uuid4())[:8]}"
    
    @staticmethod
    def get_vehicle_calendar(
        db: Session,
        vehicle_id: UUID,
        agency_id: UUID,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Récupère le calendrier de réservations d'un véhicule
        Utile pour afficher un calendrier de disponibilité
        """
        bookings = db.query(Booking).filter(
            Booking.vehicle_id == vehicle_id,
            Booking.agency_id == agency_id,
            Booking.status.in_([
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS
            ]),
            Booking.end_date >= start_date,
            Booking.start_date <= end_date
        ).all()
        
        calendar_events = []
        for booking in bookings:
            calendar_events.append({
                "id": booking.id,
                "booking_number": booking.booking_number,
                "start_date": booking.start_date.isoformat(),
                "end_date": booking.end_date.isoformat(),
                "status": booking.status,
                "customer_id": booking.customer_id
            })
        
        return calendar_events
