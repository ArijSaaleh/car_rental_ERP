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
    """
    SUPER_ADMIN = "super_admin"          # Platform administrator (not tied to an agency)
    PROPRIETAIRE = "proprietaire"        # Agency owner / Network admin
    MANAGER = "manager"                  # Agency manager
    EMPLOYEE = "employee"                # Agency employee (for future phases)


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
        default=UserRole.EMPLOYEE,
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
    agency = relationship("Agency", back_populates="users")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    def is_super_admin(self) -> bool:
        """Check if user is a super admin"""
        return self.role == UserRole.SUPER_ADMIN
    
    def is_proprietaire(self) -> bool:
        """Check if user is an agency owner"""
        return self.role == UserRole.PROPRIETAIRE
    
    def is_manager(self) -> bool:
        """Check if user is an agency manager"""
        return self.role == UserRole.MANAGER
