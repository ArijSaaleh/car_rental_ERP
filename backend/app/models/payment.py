"""
Payment model for payment gateway integration
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class PaymentMethod(str, Enum):
    CASH = "cash"  # Espèces
    CARD = "card"  # Carte bancaire
    BANK_TRANSFER = "bank_transfer"  # Virement bancaire
    PAYMEE = "paymee"  # Paymee (Tunisie)
    CLICTOPAY = "clictopay"  # ClicToPay (Tunisie)
    ONLINE = "online"  # Autre paiement en ligne


class PaymentType(str, Enum):
    DEPOSIT = "deposit"  # Caution
    RENTAL_FEE = "rental_fee"  # Frais de location
    EXTRA_CHARGES = "extra_charges"  # Frais supplémentaires (km, carburant, dommages)
    REFUND = "refund"  # Remboursement


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class Payment(Base):
    """
    Paiement avec support des passerelles tunisiennes
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_reference = Column(String(100), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    
    # Informations de paiement
    payment_method = Column(String(30), nullable=False)
    payment_type = Column(String(30), default=PaymentType.RENTAL_FEE)
    amount = Column(Numeric(10, 3), nullable=False)
    currency = Column(String(3), default="TND")
    
    # Statut
    status = Column(String(20), default=PaymentStatus.PENDING, index=True)
    
    # Passerelle de paiement (Paymee, ClicToPay, etc.)
    gateway = Column(String(50), nullable=True)  # paymee, clictopay, stripe
    gateway_transaction_id = Column(String(200), nullable=True, index=True)
    gateway_response = Column(JSON, nullable=True)  # Réponse complète de la passerelle
    gateway_fee = Column(Numeric(10, 3), default=0.000)
    
    # Webhook et callback
    webhook_received_at = Column(DateTime, nullable=True)
    callback_url = Column(String(500), nullable=True)
    
    # Informations de carte (si applicable - tokenisées)
    card_last4 = Column(String(4), nullable=True)
    card_brand = Column(String(20), nullable=True)  # Visa, Mastercard, etc.
    
    # Metadata
    description = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    processed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Horodatage
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="payments")
    booking = relationship("Booking", back_populates="payments")
    processed_by = relationship("User", foreign_keys=[processed_by_user_id])
