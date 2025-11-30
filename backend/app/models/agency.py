from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey
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
    A proprietaire (owner) can own multiple agencies
    """
    __tablename__ = "agencies"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Owner (Proprietaire) - A proprietaire can own multiple agencies
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,  # Nullable for initial setup
        index=True
    )
    
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
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_agencies")
    users = relationship("User", foreign_keys="User.agency_id", back_populates="agency", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="agency", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="agency", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="agency", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="agency", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="agency", cascade="all, delete-orphan")
    maintenances = relationship("Maintenance", back_populates="agency", cascade="all, delete-orphan")
    damage_reports = relationship("DamageReport", back_populates="agency", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="agency", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="agency", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="agency", cascade="all, delete-orphan")
    pricing_rules = relationship("PricingRule", back_populates="agency", cascade="all, delete-orphan")
    discounts = relationship("Discount", back_populates="agency", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="agency", cascade="all, delete-orphan")
    insurances = relationship("Insurance", back_populates="agency", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Agency(id={self.id}, name={self.name}, plan={self.subscription_plan})>"
    
    def has_feature(self, feature: str) -> bool:
        """
        Check if the agency has access to a specific feature based on subscription plan
        
        Features by plan:
        - BASIQUE (Phase 1): Fleet management only
        - STANDARD (Phase 2): + Dynamic pricing, contracts, customer management
        - PREMIUM (Phase 3): + OCR automation, document scanning, advanced analytics
        - ENTREPRISE (Phase 4): + Yield management, AI pricing, multi-agency network
        """
        features_by_plan: dict[SubscriptionPlan, list[str]] = {
            SubscriptionPlan.BASIQUE: [
                "fleet_management",
                "basic_bookings",
                "basic_customers",
                "basic_users",
            ],
            SubscriptionPlan.STANDARD: [
                "fleet_management",
                "basic_bookings",
                "basic_customers",
                "basic_users",
                "dynamic_pricing",
                "pricing_rules",
                "contracts",
                "payments",
                "invoicing",
                "discounts",
                "basic_reports",
            ],
            SubscriptionPlan.PREMIUM: [
                "fleet_management",
                "basic_bookings",
                "basic_customers",
                "basic_users",
                "dynamic_pricing",
                "pricing_rules",
                "contracts",
                "payments",
                "invoicing",
                "discounts",
                "basic_reports",
                "ocr_automation",
                "document_scanning",
                "electronic_signature",
                "advanced_analytics",
                "maintenance_tracking",
                "damage_reports",
                "insurance_management",
                "customer_reviews",
                "notifications",
            ],
            SubscriptionPlan.ENTREPRISE: [
                "fleet_management",
                "basic_bookings",
                "basic_customers",
                "basic_users",
                "dynamic_pricing",
                "pricing_rules",
                "contracts",
                "payments",
                "invoicing",
                "discounts",
                "basic_reports",
                "ocr_automation",
                "document_scanning",
                "electronic_signature",
                "advanced_analytics",
                "maintenance_tracking",
                "damage_reports",
                "insurance_management",
                "customer_reviews",
                "notifications",
                "yield_management",
                "ai_pricing",
                "demand_forecasting",
                "multi_agency_network",
                "consolidated_reporting",
                "api_access",
                "white_label",
            ],
        }
        
        allowed_features = features_by_plan.get(self.subscription_plan, [])  # type: ignore
        return feature in allowed_features
    
    def get_max_vehicles(self) -> int:
        """Get maximum number of vehicles allowed for subscription plan"""
        limits = {
            SubscriptionPlan.BASIQUE: 10,
            SubscriptionPlan.STANDARD: 50,
            SubscriptionPlan.PREMIUM: 200,
            SubscriptionPlan.ENTREPRISE: -1,  # Unlimited
        }
        return limits.get(self.subscription_plan, 10)  # type: ignore
    
    def get_max_users(self) -> int:
        """Get maximum number of users allowed for subscription plan"""
        limits = {
            SubscriptionPlan.BASIQUE: 3,
            SubscriptionPlan.STANDARD: 10,
            SubscriptionPlan.PREMIUM: 50,
            SubscriptionPlan.ENTREPRISE: -1,  # Unlimited
        }
        return limits.get(self.subscription_plan, 3)  # type: ignore
    
    def get_max_agencies(self) -> int:
        """Get maximum number of agencies in network (for proprietaire)"""
        limits = {
            SubscriptionPlan.BASIQUE: 1,
            SubscriptionPlan.STANDARD: 1,
            SubscriptionPlan.PREMIUM: 3,
            SubscriptionPlan.ENTREPRISE: -1,  # Unlimited
        }
        return limits.get(self.subscription_plan, 1)  # type: ignore
