"""
Contract model for legal documentation and PDF generation
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class ContractStatus(str, Enum):
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Contract(Base):
    """
    Contrat de location avec signature électronique
    """
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    
    # Statut
    status = Column(String(30), default=ContractStatus.DRAFT, index=True)
    
    # Documents PDF
    pdf_url = Column(String(500), nullable=True)  # URL du PDF généré
    pdf_storage_path = Column(String(500), nullable=True)  # Chemin stockage local/S3
    pdf_generated_at = Column(DateTime, nullable=True)
    
    # Signature électronique
    customer_signature_data = Column(Text, nullable=True)  # Base64 signature pad data
    customer_signed_at = Column(DateTime, nullable=True)
    customer_ip_address = Column(String(45), nullable=True)
    
    agent_signature_data = Column(Text, nullable=True)
    agent_signed_at = Column(DateTime, nullable=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Conditions Générales de Location (CGL)
    terms_and_conditions = Column(Text, nullable=False)  # CGL de l'agence
    customer_accepted_terms = Column(Boolean, default=False)
    accepted_terms_at = Column(DateTime, nullable=True)
    
    # Clauses spécifiques
    special_clauses = Column(JSON, nullable=True)  # Clauses additionnelles
    
    # Informations légales Tunisie
    timbre_fiscal_amount = Column(String(20), default="0.600 TND")
    contract_language = Column(String(10), default="fr")  # fr, ar
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="contracts")
    booking = relationship("Booking", back_populates="contract")
    agent = relationship("User", foreign_keys=[agent_id])
