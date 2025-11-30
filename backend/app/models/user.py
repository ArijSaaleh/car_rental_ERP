from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    User roles in the system
    
    SUPER_ADMIN: Platform SaaS administrator (development/management team)
    PROPRIETAIRE: Business owner managing one or more agency networks
    MANAGER: Agency manager responsible for a specific location
    AGENT_COMPTOIR: Counter agent handling daily operations (reservations, contracts, check-in/out)
    AGENT_PARC: Fleet agent in charge of physical vehicle inspections
    CLIENT: End user who rents vehicles (for customer portal in future phases)
    """
    SUPER_ADMIN = "super_admin"          # Platform administrator (not tied to an agency)
    PROPRIETAIRE = "proprietaire"        # Agency owner / Network admin
    MANAGER = "manager"                  # Agency manager
    AGENT_COMPTOIR = "agent_comptoir"    # Counter agent (reservations, contracts, payments)
    AGENT_PARC = "agent_parc"            # Fleet agent (vehicle inspections)
    CLIENT = "client"                    # Customer (for future customer portal)


class User(Base):
    """
    User model - Represents users in the system
    Users are associated with agencies (tenants) except for super_admin
    """
    __tablename__ = "users"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # User Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Role
    role = Column(
        SQLEnum(UserRole),
        default=UserRole.AGENT_COMPTOIR,
        nullable=False,
        index=True
    )
    
    # Multi-Tenant Association
    agency_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agencies.id", ondelete="CASCADE"),
        nullable=True,  # Nullable for super_admin
        index=True
    )
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    agency = relationship("Agency", foreign_keys=[agency_id], back_populates="users")
    # owned_agencies relationship is defined in Agency model with backref
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    def is_super_admin(self) -> bool:
        """Check if user is a super admin"""
        return bool(self.role == UserRole.SUPER_ADMIN)
    
    def is_proprietaire(self) -> bool:
        """Check if user is an agency owner"""
        return bool(self.role == UserRole.PROPRIETAIRE)
    
    def is_manager(self) -> bool:
        """Check if user is an agency manager"""
        return bool(self.role == UserRole.MANAGER)
    
    def is_agent_comptoir(self) -> bool:
        """Check if user is a counter agent"""
        return bool(self.role == UserRole.AGENT_COMPTOIR)
    
    def is_agent_parc(self) -> bool:
        """Check if user is a fleet agent"""
        return bool(self.role == UserRole.AGENT_PARC)
    
    def is_client(self) -> bool:
        """Check if user is a client"""
        return bool(self.role == UserRole.CLIENT)
    
    def can_manage_agency(self) -> bool:
        """Check if user can manage agency operations (proprietaire or manager)"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_handle_counter_operations(self) -> bool:
        """Check if user can handle counter operations (contracts, payments, reservations)"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR])
    
    def can_inspect_vehicles(self) -> bool:
        """Check if user can perform vehicle inspections"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_PARC, UserRole.AGENT_COMPTOIR])
    
    # Detailed Permission Methods Based on Role
    
    def can_manage_subscriptions(self) -> bool:
        """Platform management: Manage agency subscriptions and SaaS billing"""
        return bool(self.role == UserRole.SUPER_ADMIN)
    
    def can_manage_multiple_agencies(self) -> bool:
        """Network management: Manage multiple agencies and network-wide settings"""
        return bool(self.role == UserRole.PROPRIETAIRE)
    
    def can_manage_users(self) -> bool:
        """User management: Create/edit users within agency"""
        return bool(self.role in [UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_manage_fleet(self) -> bool:
        """Fleet management: Add/edit/delete vehicles"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_manage_pricing(self) -> bool:
        """Pricing management: Set global tariffs and pricing rules"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_view_consolidated_reports(self) -> bool:
        """Reporting: View consolidated reports across agencies"""
        return bool(self.role == UserRole.PROPRIETAIRE)
    
    def can_view_agency_reports(self) -> bool:
        """Reporting: View local agency reports"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_create_contracts(self) -> bool:
        """Contract operations: Create and manage rental contracts"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR])
    
    def can_manage_bookings(self) -> bool:
        """Booking operations: Create/edit/cancel bookings"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR])
    
    def can_process_payments(self) -> bool:
        """Payment operations: Process payments and manage deposits"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR])
    
    def can_perform_checkin_checkout(self) -> bool:
        """Check-in/out operations: Handle vehicle pickup and return"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
    
    def can_document_vehicle_state(self) -> bool:
        """Vehicle inspection: Document vehicle state with photos, mileage, fuel"""
        return bool(self.role in [UserRole.AGENT_PARC, UserRole.MANAGER, UserRole.AGENT_COMPTOIR])
    
    def can_upload_inspection_photos(self) -> bool:
        """Photo upload: Upload timestamped inspection photos"""
        return bool(self.role in [UserRole.AGENT_PARC, UserRole.MANAGER])
    
    def can_make_reservations(self) -> bool:
        """Reservation widget: Book and pay online (customer facing)"""
        return bool(self.role == UserRole.CLIENT)
    
    def can_sign_contracts_electronically(self) -> bool:
        """Electronic signature: Sign rental contracts digitally"""
        return bool(self.role == UserRole.CLIENT)
    
    def can_access_customer_portal(self) -> bool:
        """Customer portal: Access booking history and invoices"""
        return bool(self.role == UserRole.CLIENT)
    
    def can_manage_maintenance(self) -> bool:
        """Maintenance management: Schedule and track vehicle maintenance"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_manage_damage_reports(self) -> bool:
        """Damage management: Create and manage damage reports"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC])
    
    def can_manage_insurance(self) -> bool:
        """Insurance management: Manage policies and claims"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
    
    def can_apply_discounts(self) -> bool:
        """Discount management: Apply promo codes and discounts"""
        return bool(self.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR])
    
    def can_moderate_reviews(self) -> bool:
        """Review moderation: Moderate and respond to customer reviews"""
        return bool(self.role in [UserRole.PROPRIETAIRE, UserRole.MANAGER])
