from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class VehicleStatus(str, enum.Enum):
    """
    Vehicle status
    """
    DISPONIBLE = "disponible"      # Available for rental
    LOUE = "loue"                  # Currently rented
    MAINTENANCE = "maintenance"    # Under maintenance
    HORS_SERVICE = "hors_service"  # Out of service


class FuelType(str, enum.Enum):
    """
    Fuel types
    """
    ESSENCE = "essence"
    DIESEL = "diesel"
    HYBRIDE = "hybride"
    ELECTRIQUE = "electrique"


class TransmissionType(str, enum.Enum):
    """
    Transmission types
    """
    MANUELLE = "manuelle"
    AUTOMATIQUE = "automatique"


class Vehicle(Base):
    """
    Vehicle model - Represents vehicles in the fleet
    Each vehicle belongs to an agency (tenant)
    """
    __tablename__ = "vehicles"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Multi-Tenant Association (Critical for data isolation)
    agency_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True  # Important for query performance
    )
    
    # Vehicle Identification
    license_plate = Column(String(20), nullable=False, unique=True, index=True)  # Plaque d'immatriculation
    vin = Column(String(17), nullable=True, unique=True)  # Vehicle Identification Number
    
    # Vehicle Details
    brand = Column(String(100), nullable=False, index=True)  # Marque (e.g., Renault, Peugeot)
    model = Column(String(100), nullable=False)              # Modèle (e.g., Clio, 208)
    year = Column(Integer, nullable=False)                   # Année
    color = Column(String(50), nullable=True)
    
    # Technical Specifications
    fuel_type = Column(SQLEnum(FuelType), nullable=False)
    transmission = Column(SQLEnum(TransmissionType), nullable=False)
    seats = Column(Integer, default=5)
    doors = Column(Integer, default=4)
    
    # Mileage and Condition
    mileage = Column(Integer, default=0, nullable=False)  # Kilométrage
    status = Column(
        SQLEnum(VehicleStatus),
        default=VehicleStatus.DISPONIBLE,
        nullable=False,
        index=True
    )
    
    # Documents and Legal
    registration_number = Column(String(50), nullable=True)    # Numéro de carte grise
    insurance_policy = Column(String(100), nullable=True)      # Numéro d'assurance
    insurance_expiry = Column(DateTime(timezone=True), nullable=True)
    technical_control_expiry = Column(DateTime(timezone=True), nullable=True)  # Contrôle technique
    
    # Pricing (for future phases, but included in schema)
    daily_rate = Column(Float, nullable=True)  # Tarif journalier
    
    # Additional Information
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    agency = relationship("Agency", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle")
    maintenances = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")
    damage_reports = relationship("DamageReport", back_populates="vehicle", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="vehicle", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="vehicle", cascade="all, delete-orphan")
    insurances = relationship("Insurance", back_populates="vehicle", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Vehicle(id={self.id}, license_plate={self.license_plate}, brand={self.brand}, model={self.model})>"
    
    def is_available(self) -> bool:
        """Check if vehicle is available for rental"""
        return bool(self.status == VehicleStatus.DISPONIBLE)
    
    def needs_maintenance(self) -> bool:
        """Check if vehicle is in maintenance"""
        return bool(self.status == VehicleStatus.MAINTENANCE)
