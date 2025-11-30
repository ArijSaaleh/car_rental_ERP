"""
Discount model for promotions and discount codes
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class DiscountType(str, Enum):
    PERCENTAGE = "percentage"  # Pourcentage
    FIXED_AMOUNT = "fixed_amount"  # Montant fixe
    FREE_DAYS = "free_days"  # Jours gratuits


class DiscountStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    EXHAUSTED = "exhausted"  # Nombre d'utilisations atteint


class Discount(Base):
    """
    Codes promo et réductions
    """
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    
    # Code et identification
    code = Column(String(50), unique=True, index=True, nullable=False)  # ex: SUMMER2024
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Type et valeur
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(Numeric(10, 3), nullable=False)  # 20.000 pour 20% ou 20 TND
    
    # Période de validité
    valid_from = Column(DateTime, nullable=False, index=True)
    valid_to = Column(DateTime, nullable=False, index=True)
    
    # Limites d'utilisation
    max_uses = Column(Integer, nullable=True)  # Nombre max d'utilisations total
    max_uses_per_customer = Column(Integer, default=1)  # Par client
    current_uses = Column(Integer, default=0)
    
    # Conditions d'application
    minimum_rental_days = Column(Integer, nullable=True)
    minimum_amount = Column(Numeric(10, 3), nullable=True)  # Montant minimum de location
    
    # Restrictions
    applies_to_new_customers_only = Column(Boolean, default=False)
    requires_minimum_advance_booking = Column(Integer, nullable=True)  # Jours avant
    
    # Statut
    status = Column(String(20), default=DiscountStatus.ACTIVE, index=True)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Visible publiquement ou code privé
    
    # Suivi
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Statistiques
    total_discount_given = Column(Numeric(12, 3), default=0.000)
    total_bookings = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="discounts")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    booking_discounts = relationship("BookingDiscount", back_populates="discount")


class BookingDiscount(Base):
    """
    Association entre réservations et codes promo appliqués
    """
    __tablename__ = "booking_discounts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relations
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    discount_id = Column(Integer, ForeignKey("discounts.id"), nullable=False, index=True)
    
    # Montant de la réduction appliquée
    discount_amount = Column(Numeric(10, 3), nullable=False)
    
    # Metadata
    applied_at = Column(DateTime, default=datetime.utcnow)
    applied_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relations
    booking = relationship("Booking", back_populates="booking_discounts")
    discount = relationship("Discount", back_populates="booking_discounts")
    applied_by = relationship("User", foreign_keys=[applied_by_user_id])
