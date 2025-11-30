"""
Insurance model for insurance policy tracking
"""
from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class InsuranceType(str, Enum):
    LIABILITY = "liability"  # Responsabilité civile (obligatoire)
    COMPREHENSIVE = "comprehensive"  # Tous risques
    COLLISION = "collision"  # Collision
    THEFT = "theft"  # Vol
    FIRE = "fire"  # Incendie
    PERSONAL_ACCIDENT = "personal_accident"  # Accidents personnels


class InsuranceStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING_RENEWAL = "pending_renewal"


class Insurance(Base):
    """
    Polices d'assurance véhicules
    """
    __tablename__ = "insurances"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String(100), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    
    # Compagnie d'assurance
    insurance_company = Column(String(200), nullable=False)
    insurance_company_phone = Column(String(20), nullable=True)
    insurance_company_email = Column(String(255), nullable=True)
    
    # Type et couverture
    insurance_type = Column(String(30), nullable=False)
    coverage_description = Column(Text, nullable=True)
    coverage_limits = Column(JSON, nullable=True)  # Limites de couverture détaillées
    
    # Dates
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    renewal_date = Column(Date, nullable=True)
    
    # Montants
    premium_amount = Column(Numeric(10, 3), nullable=False)  # Prime annuelle
    deductible_amount = Column(Numeric(10, 3), nullable=True)  # Franchise
    coverage_amount = Column(Numeric(12, 3), nullable=True)  # Montant de couverture
    
    # Statut
    status = Column(String(30), default=InsuranceStatus.ACTIVE, index=True)
    is_active = Column(Boolean, default=True)
    auto_renew = Column(Boolean, default=False)
    
    # Documents
    policy_document_url = Column(String(500), nullable=True)
    certificate_url = Column(String(500), nullable=True)
    
    # Bénéficiaires
    beneficiaries = Column(JSON, nullable=True)
    
    # Clauses spéciales
    special_conditions = Column(Text, nullable=True)
    exclusions = Column(Text, nullable=True)
    
    # Sinistres
    claims_count = Column(Integer, default=0)
    total_claims_amount = Column(Numeric(12, 3), default=0.000)
    
    # Notifications
    reminder_sent_30_days = Column(Boolean, default=False)
    reminder_sent_15_days = Column(Boolean, default=False)
    reminder_sent_7_days = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Suivi
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="insurances")
    vehicle = relationship("Vehicle", back_populates="insurances")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    insurance_claims = relationship("InsuranceClaim", back_populates="insurance")


class InsuranceClaim(Base):
    """
    Déclarations de sinistre
    """
    __tablename__ = "insurance_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(100), unique=True, index=True, nullable=False)
    
    # Relations
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    insurance_id = Column(Integer, ForeignKey("insurances.id"), nullable=False, index=True)
    damage_report_id = Column(Integer, ForeignKey("damage_reports.id"), nullable=True, index=True)
    
    # Détails du sinistre
    incident_date = Column(DateTime, nullable=False)
    claim_date = Column(Date, nullable=False)
    incident_description = Column(Text, nullable=False)
    incident_location = Column(String(500), nullable=True)
    
    # Montants
    claimed_amount = Column(Numeric(10, 3), nullable=False)
    approved_amount = Column(Numeric(10, 3), nullable=True)
    paid_amount = Column(Numeric(10, 3), default=0.000)
    deductible_paid = Column(Numeric(10, 3), nullable=True)
    
    # Statut
    status = Column(String(30), default="filed", index=True)  # filed, reviewing, approved, rejected, paid
    is_approved = Column(Boolean, default=False)
    
    # Documents
    claim_documents = Column(JSON, nullable=True)  # URLs des documents
    police_report_number = Column(String(100), nullable=True)
    
    # Dates importantes
    reviewed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Suivi
    filed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency")
    insurance = relationship("Insurance", back_populates="insurance_claims")
    damage_report = relationship("DamageReport", back_populates="insurance_claim")
    filed_by = relationship("User", foreign_keys=[filed_by_user_id])
