"""
Invoice model for billing and accounting
"""
from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class InvoiceStatus(str, Enum):
    DRAFT = "draft"  # Brouillon
    ISSUED = "issued"  # Émise
    SENT = "sent"  # Envoyée
    PAID = "paid"  # Payée
    PARTIALLY_PAID = "partially_paid"  # Partiellement payée
    OVERDUE = "overdue"  # En retard
    CANCELLED = "cancelled"  # Annulée


class InvoiceType(str, Enum):
    RENTAL = "rental"  # Location
    DEPOSIT = "deposit"  # Caution
    EXTRA_CHARGES = "extra_charges"  # Frais supplémentaires
    DAMAGE = "damage"  # Dommages
    CREDIT_NOTE = "credit_note"  # Avoir


class Invoice(Base):
    """
    Facture conforme aux normes tunisiennes
    """
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    
    # Type et statut
    invoice_type = Column(String(30), default=InvoiceType.RENTAL, index=True)
    status = Column(String(20), default=InvoiceStatus.DRAFT, index=True)
    
    # Dates
    invoice_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date, nullable=False, index=True)
    paid_date = Column(Date, nullable=True)
    
    # Montants
    subtotal = Column(Numeric(10, 3), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=19.00)  # TVA Tunisie: 19%
    tax_amount = Column(Numeric(10, 3), nullable=False)
    timbre_fiscal = Column(Numeric(10, 3), default=1.000)  # Timbre fiscal
    discount_amount = Column(Numeric(10, 3), default=0.000)
    total_amount = Column(Numeric(10, 3), nullable=False)
    paid_amount = Column(Numeric(10, 3), default=0.000)
    balance_due = Column(Numeric(10, 3), nullable=False)
    
    # Détails des lignes de facturation
    line_items = Column(JSON, nullable=False)  # Array of {description, quantity, unit_price, amount}
    
    # Informations légales Tunisie
    agency_tax_id = Column(String(50), nullable=True)  # Matricule fiscal agence
    agency_registry = Column(String(50), nullable=True)  # RNE
    customer_tax_id = Column(String(50), nullable=True)  # Si client entreprise
    
    # Documents
    pdf_url = Column(String(500), nullable=True)
    pdf_generated_at = Column(DateTime, nullable=True)
    
    # Envoi
    sent_at = Column(DateTime, nullable=True)
    sent_to_email = Column(String(255), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    
    # Référence
    reference = Column(String(200), nullable=True)  # Référence interne ou externe
    
    # Suivi
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="invoices")
    booking = relationship("Booking", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    payments = relationship("Payment", back_populates="invoice")
