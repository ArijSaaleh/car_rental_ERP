from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class SubscriptionPlan(str, enum.Enum):
    """
    Subscription plans for agencies
    """
    BASIQUE = "basique"          # Phase 1: Fleet management
    STANDARD = "standard"        # Phase 2: Pricing + Contracts
    PREMIUM = "premium"          # Phase 3: Counter automation (OCR)
    ENTREPRISE = "entreprise"    # Phase 4: Yield Management


class Agency(Base):
    """
    Agency model - Represents a tenant in the multi-tenant system
    Each agency is a separate client with isolated data
    """
    __tablename__ = "agencies"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Agency Information
    name = Column(String(255), nullable=False, index=True)
    legal_name = Column(String(255), nullable=False)
    tax_id = Column(String(50), unique=True, nullable=False, index=True)  # Matricule fiscal
    
    # Contact Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), default="Tunisia")
    
    # Subscription
    subscription_plan = Column(
        SQLEnum(SubscriptionPlan),
        default=SubscriptionPlan.BASIQUE,
        nullable=False
    )
    subscription_start_date = Column(DateTime(timezone=True), server_default=func.now())
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Feature Flags (JSON column could be added for more flexibility)
    # For now, features are determined by subscription_plan
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="agency", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="agency", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="agency", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="agency", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="agency", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="agency", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Agency(id={self.id}, name={self.name}, plan={self.subscription_plan})>"
    
    def has_feature(self, feature: str) -> bool:
        """
        Check if the agency has access to a specific feature based on subscription plan
        """
        features_by_plan = {
            SubscriptionPlan.BASIQUE: ["fleet_management"],
            SubscriptionPlan.STANDARD: ["fleet_management", "pricing", "contracts"],
            SubscriptionPlan.PREMIUM: ["fleet_management", "pricing", "contracts", "ocr_automation"],
            SubscriptionPlan.ENTREPRISE: ["fleet_management", "pricing", "contracts", "ocr_automation", "yield_management"],
        }
        
        allowed_features = features_by_plan.get(self.subscription_plan, [])
        return feature in allowed_features
