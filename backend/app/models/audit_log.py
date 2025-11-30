"""
Audit log model for tracking super admin actions
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class AuditLog(Base):
    """
    Audit log for tracking all super admin actions
    """
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Admin who performed the action
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    admin_email = Column(String(255), nullable=False)
    
    # Action details
    action = Column(String(100), nullable=False, index=True)  # create_agency, deactivate_user, etc.
    resource_type = Column(String(50), nullable=False, index=True)  # agency, user, subscription, etc.
    resource_id = Column(String(255), nullable=True, index=True)
    
    # Additional context
    details = Column(JSON, nullable=True)  # Full details of the action
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    admin = relationship("User", foreign_keys=[admin_id])
    
    def __repr__(self):
        return f"<AuditLog(action={self.action}, admin={self.admin_email}, resource={self.resource_type})>"
