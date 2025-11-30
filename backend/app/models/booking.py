"""
Booking model for reservation management
"""
from datetime import datetime, date
from enum import Enum
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class BookingStatus(str, Enum):
    PENDING = "pending"  # En attente de confirmation
    CONFIRMED = "confirmed"  # Confirmée
    IN_PROGRESS = "in_progress"  # En cours (véhicule récupéré)
    COMPLETED = "completed"  # Terminée
    CANCELLED = "cancelled"  # Annulée


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    REFUNDED = "refunded"
    FAILED = "failed"


class Booking(Base):
    """
    Réservation de véhicule avec calcul de disponibilité
    """
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Dates de réservation
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    pickup_datetime = Column(DateTime, nullable=True)
    return_datetime = Column(DateTime, nullable=True)
    
    # Détails financiers
    daily_rate = Column(Numeric(10, 3), nullable=False)  # TND avec 3 décimales
    duration_days = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 3), nullable=False)
    tax_amount = Column(Numeric(10, 3), default=0.000)
    timbre_fiscal = Column(Numeric(10, 3), default=0.600)  # Timbre fiscal Tunisie: 0.600 TND
    total_amount = Column(Numeric(10, 3), nullable=False)
    deposit_amount = Column(Numeric(10, 3), default=0.000)
    
    # Statuts
    status = Column(String(20), default=BookingStatus.PENDING, index=True)
    payment_status = Column(String(20), default=PaymentStatus.PENDING, index=True)
    
    # Kilométrage
    initial_mileage = Column(Integer, nullable=True)
    final_mileage = Column(Integer, nullable=True)
    mileage_limit = Column(Integer, nullable=True)  # Limite km inclus
    extra_mileage_rate = Column(Numeric(10, 3), nullable=True)  # Prix par km supplémentaire
    
    # Carburant
    initial_fuel_level = Column(String(20), nullable=True)  # full, 3/4, half, 1/4, empty
    final_fuel_level = Column(String(20), nullable=True)
    fuel_policy = Column(String(50), default="full_to_full")
    
    # Notes et commentaires
    notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    customer = relationship("Customer", back_populates="bookings")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    contract = relationship("Contract", back_populates="booking", uselist=False)
    payments = relationship("Payment", back_populates="booking")
