"""
Maintenance model for vehicle maintenance tracking
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class MaintenanceType(str, Enum):
    PREVENTIVE = "preventive"  # Maintenance préventive
    CORRECTIVE = "corrective"  # Réparation
    INSPECTION = "inspection"  # Contrôle technique
    TIRE_CHANGE = "tire_change"  # Changement pneus
    OIL_CHANGE = "oil_change"  # Vidange
    BRAKE_SERVICE = "brake_service"  # Freins
    BATTERY = "battery"  # Batterie
    OTHER = "other"


class MaintenanceStatus(str, Enum):
    SCHEDULED = "scheduled"  # Planifiée
    IN_PROGRESS = "in_progress"  # En cours
    COMPLETED = "completed"  # Terminée
    CANCELLED = "cancelled"  # Annulée


class Maintenance(Base):
    """
    Suivi de la maintenance des véhicules
    """
    __tablename__ = "maintenances"

    id = Column(Integer, primary_key=True, index=True)
    maintenance_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    
    # Type et statut
    maintenance_type = Column(String(30), nullable=False, index=True)
    status = Column(String(20), default=MaintenanceStatus.SCHEDULED, index=True)
    
    # Dates
    scheduled_date = Column(DateTime, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Détails
    description = Column(Text, nullable=False)
    work_performed = Column(Text, nullable=True)  # Travaux effectués
    
    # Kilométrage
    mileage_at_maintenance = Column(Integer, nullable=True)
    next_maintenance_mileage = Column(Integer, nullable=True)
    
    # Informations garage
    garage_name = Column(String(200), nullable=True)
    mechanic_name = Column(String(100), nullable=True)
    
    # Financier
    estimated_cost = Column(Numeric(10, 3), nullable=True)
    actual_cost = Column(Numeric(10, 3), nullable=True)
    parts_cost = Column(Numeric(10, 3), default=0.000)
    labor_cost = Column(Numeric(10, 3), default=0.000)
    
    # Documents
    invoice_number = Column(String(100), nullable=True)
    invoice_url = Column(String(500), nullable=True)
    
    # Suivi
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    completed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="maintenances")
    vehicle = relationship("Vehicle", back_populates="maintenances")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    completed_by = relationship("User", foreign_keys=[completed_by_user_id])
