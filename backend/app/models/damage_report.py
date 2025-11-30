"""
Damage Report model for tracking vehicle damages
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class DamageSeverity(str, Enum):
    MINOR = "minor"  # Mineur (rayure, petite bosse)
    MODERATE = "moderate"  # Modéré
    MAJOR = "major"  # Majeur (réparation importante)
    TOTAL_LOSS = "total_loss"  # Perte totale


class DamageStatus(str, Enum):
    REPORTED = "reported"  # Signalé
    ASSESSING = "assessing"  # En évaluation
    REPAIRING = "repairing"  # En réparation
    REPAIRED = "repaired"  # Réparé
    INSURANCE_CLAIM = "insurance_claim"  # Déclaration assurance
    CLOSED = "closed"  # Clôturé


class DamageReport(Base):
    """
    Rapport de dommages sur véhicule
    """
    __tablename__ = "damage_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    
    # Détails du dommage
    damage_type = Column(String(100), nullable=False)  # collision, rayure, bris de glace, etc.
    severity = Column(String(20), nullable=False, index=True)
    status = Column(String(30), default=DamageStatus.REPORTED, index=True)
    
    # Description
    description = Column(Text, nullable=False)
    location_on_vehicle = Column(String(200), nullable=True)  # Avant gauche, portière droite, etc.
    
    # Circonstances
    occurred_at = Column(DateTime, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    location_address = Column(String(500), nullable=True)
    weather_conditions = Column(String(100), nullable=True)
    
    # Responsabilité
    customer_responsible = Column(Boolean, default=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    third_party_involved = Column(Boolean, default=False)
    third_party_info = Column(JSON, nullable=True)
    
    # Police et assurance
    police_report_filed = Column(Boolean, default=False)
    police_report_number = Column(String(100), nullable=True)
    insurance_claim_filed = Column(Boolean, default=False)
    insurance_claim_number = Column(String(100), nullable=True)
    insurance_company = Column(String(200), nullable=True)
    
    # Évaluation et coûts
    estimated_repair_cost = Column(Numeric(10, 3), nullable=True)
    actual_repair_cost = Column(Numeric(10, 3), nullable=True)
    customer_charge_amount = Column(Numeric(10, 3), default=0.000)
    insurance_coverage_amount = Column(Numeric(10, 3), default=0.000)
    
    # Documents et photos
    photos = Column(JSON, nullable=True)  # Array of photo URLs
    documents = Column(JSON, nullable=True)  # Constat amiable, factures, etc.
    
    # Suivi
    reported_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assessed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Relations
    agency = relationship("Agency", back_populates="damage_reports")
    vehicle = relationship("Vehicle", back_populates="damage_reports")
    booking = relationship("Booking", back_populates="damage_reports")
    customer = relationship("Customer", back_populates="damage_reports")
    reported_by = relationship("User", foreign_keys=[reported_by_user_id])
    assessed_by = relationship("User", foreign_keys=[assessed_by_user_id])
    insurance_claim = relationship("InsuranceClaim", back_populates="damage_report", uselist=False)
