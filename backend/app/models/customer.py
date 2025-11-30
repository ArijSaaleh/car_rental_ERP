"""
Customer model for client management
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class CustomerType(str, Enum):
    INDIVIDUAL = "individual"  # Particulier
    COMPANY = "company"  # Entreprise


class Customer(Base):
    """
    Client de l'agence (Particulier ou Entreprise)
    """
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    
    # Multi-tenant
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False, index=True)
    
    # Informations générales
    customer_type = Column(String(20), default=CustomerType.INDIVIDUAL)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    
    # Informations personnelles (CIN Tunisie)
    cin_number = Column(String(20), unique=True, index=True, nullable=True)
    cin_issue_date = Column(Date, nullable=True)
    cin_expiry_date = Column(Date, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    place_of_birth = Column(String(100), nullable=True)
    
    # Permis de conduire
    license_number = Column(String(50), nullable=False)
    license_issue_date = Column(Date, nullable=True)
    license_expiry_date = Column(Date, nullable=True)
    license_category = Column(String(20), nullable=True)  # B, C, D, etc.
    
    # Adresse
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country = Column(String(100), default="Tunisia")
    
    # Informations entreprise (si customer_type = COMPANY)
    company_name = Column(String(200), nullable=True)
    company_tax_id = Column(String(50), nullable=True)  # Matricule fiscal Tunisie
    company_registry_number = Column(String(50), nullable=True)  # RNE
    
    # Statut
    is_active = Column(Boolean, default=True)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="customers")
    bookings = relationship("Booking", back_populates="customer")
