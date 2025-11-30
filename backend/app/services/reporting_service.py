"""
Reporting service for business intelligence
"""
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.payment import Payment, PaymentStatus


class ReportingService:
    """
    Service de reporting et statistiques pour les managers
    """
    
    @staticmethod
    def get_occupancy_rate(
        db: Session,
        agency_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Calcule le taux d'occupation de la flotte pour une période
        
        Taux d'occupation = (Jours de location réels / Jours disponibles totaux) × 100
        """
        # Nombre total de véhicules de l'agence
        total_vehicles = db.query(func.count(Vehicle.id)).filter(
            Vehicle.agency_id == agency_id,
            Vehicle.status != VehicleStatus.HORS_SERVICE
        ).scalar() or 1  # Éviter division par zéro
        
        # Nombre de jours dans la période
        period_days = (end_date - start_date).days + 1
        
        # Jours disponibles totaux = nombre de véhicules × nombre de jours
        total_available_days = total_vehicles * period_days
        
        # Récupérer toutes les réservations actives dans la période
        bookings = db.query(Booking).filter(
            Booking.agency_id == agency_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]),
            Booking.end_date >= start_date,
            Booking.start_date <= end_date
        ).all()
        
        # Calculer les jours de location réels
        rented_days = 0
        for booking in bookings:
            # Intersection de la réservation avec la période
            booking_start = max(booking.start_date, start_date)
            booking_end = min(booking.end_date, end_date)
            days = (booking_end - booking_start).days + 1
            if days > 0:
                rented_days += days
        
        # Taux d'occupation
        occupancy_rate = (rented_days / total_available_days * 100) if total_available_days > 0 else 0
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": period_days
            },
            "fleet": {
                "total_vehicles": total_vehicles,
                "total_available_days": total_available_days
            },
            "bookings": {
                "total_bookings": len(bookings),
                "rented_days": rented_days
            },
            "occupancy_rate": round(occupancy_rate, 2)
        }
    
    
    @staticmethod
    def get_revenue_report(
        db: Session,
        agency_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Génère un rapport de chiffre d'affaires pour une période
        """
        # Paiements complétés dans la période
        payments = db.query(Payment).filter(
            Payment.agency_id == agency_id,
            Payment.status == PaymentStatus.COMPLETED,
            func.date(Payment.paid_at) >= start_date,
            func.date(Payment.paid_at) <= end_date
        ).all()
        
        # Calculs
        total_revenue = sum(float(p.amount) for p in payments)
        total_gateway_fees = sum(float(p.gateway_fee) for p in payments)
        net_revenue = total_revenue - total_gateway_fees
        
        # Répartition par méthode de paiement
        payment_methods = {}
        for payment in payments:
            method = payment.payment_method
            if method not in payment_methods:
                payment_methods[method] = {
                    "count": 0,
                    "amount": 0.0
                }
            payment_methods[method]["count"] += 1
            payment_methods[method]["amount"] += float(payment.amount)
        
        # Réservations dans la période
        bookings = db.query(Booking).filter(
            Booking.agency_id == agency_id,
            func.date(Booking.created_at) >= start_date,
            func.date(Booking.created_at) <= end_date
        ).all()
        
        total_bookings = len(bookings)
        completed_bookings = sum(1 for b in bookings if b.status == BookingStatus.COMPLETED)
        cancelled_bookings = sum(1 for b in bookings if b.status == BookingStatus.CANCELLED)
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "revenue": {
                "total_revenue": round(total_revenue, 3),
                "gateway_fees": round(total_gateway_fees, 3),
                "net_revenue": round(net_revenue, 3),
                "currency": "TND"
            },
            "payments": {
                "total_payments": len(payments),
                "by_method": payment_methods
            },
            "bookings": {
                "total": total_bookings,
                "completed": completed_bookings,
                "cancelled": cancelled_bookings,
                "conversion_rate": round((completed_bookings / total_bookings * 100) if total_bookings > 0 else 0, 2)
            }
        }
    
    
    @staticmethod
    def get_monthly_revenue(
        db: Session,
        agency_id: int,
        year: int,
        month: int
    ) -> Dict[str, Any]:
        """
        Chiffre d'affaires mensuel
        """
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        return ReportingService.get_revenue_report(db, agency_id, start_date, end_date)
    
    
    @staticmethod
    def get_fleet_status(db: Session, agency_id: int) -> Dict[str, Any]:
        """
        État actuel de la flotte
        """
        vehicles = db.query(Vehicle).filter(Vehicle.agency_id == agency_id).all()
        
        status_count = {}
        for vehicle in vehicles:
            status = vehicle.status.value
            status_count[status] = status_count.get(status, 0) + 1
        
        return {
            "total_vehicles": len(vehicles),
            "by_status": status_count,
            "available": status_count.get(VehicleStatus.DISPONIBLE.value, 0),
            "rented": status_count.get(VehicleStatus.LOUE.value, 0),
            "maintenance": status_count.get(VehicleStatus.MAINTENANCE.value, 0)
        }
    
    
    @staticmethod
    def get_dashboard_summary(
        db: Session,
        agency_id: int
    ) -> Dict[str, Any]:
        """
        Résumé complet pour le dashboard du manager
        """
        today = date.today()
        month_start = date(today.year, today.month, 1)
        
        # Taux d'occupation du mois en cours
        occupancy = ReportingService.get_occupancy_rate(
            db, agency_id, month_start, today
        )
        
        # Chiffre d'affaires du mois
        revenue = ReportingService.get_monthly_revenue(
            db, agency_id, today.year, today.month
        )
        
        # État de la flotte
        fleet = ReportingService.get_fleet_status(db, agency_id)
        
        # Réservations actives
        active_bookings = db.query(func.count(Booking.id)).filter(
            Booking.agency_id == agency_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        ).scalar() or 0
        
        # Prochaines réservations (7 jours)
        upcoming_bookings = db.query(func.count(Booking.id)).filter(
            Booking.agency_id == agency_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_date >= today,
            Booking.start_date <= today + timedelta(days=7)
        ).scalar() or 0
        
        return {
            "date": today.isoformat(),
            "occupancy_rate": occupancy["occupancy_rate"],
            "monthly_revenue": revenue["revenue"]["total_revenue"],
            "fleet_status": fleet,
            "active_bookings": active_bookings,
            "upcoming_bookings": upcoming_bookings,
            "full_occupancy_data": occupancy,
            "full_revenue_data": revenue
        }
    
    
    @staticmethod
    def get_top_vehicles(
        db: Session,
        agency_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Véhicules les plus loués
        """
        from sqlalchemy import desc
        
        vehicle_stats = db.query(
            Vehicle.id,
            Vehicle.brand,
            Vehicle.model,
            Vehicle.license_plate,
            func.count(Booking.id).label('booking_count'),
            func.sum(Booking.total_amount).label('total_revenue')
        ).join(
            Booking, Booking.vehicle_id == Vehicle.id
        ).filter(
            Vehicle.agency_id == agency_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED])
        ).group_by(
            Vehicle.id
        ).order_by(
            desc('booking_count')
        ).limit(limit).all()
        
        return [
            {
                "vehicle_id": v.id,
                "brand": v.brand,
                "model": v.model,
                "license_plate": v.license_plate,
                "booking_count": v.booking_count,
                "total_revenue": float(v.total_revenue or 0)
            }
            for v in vehicle_stats
        ]
