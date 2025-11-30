"""
Notification model for system notifications
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class NotificationType(str, Enum):
    # Booking notifications
    BOOKING_CREATED = "booking_created"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_REMINDER = "booking_reminder"
    PICKUP_REMINDER = "pickup_reminder"
    RETURN_REMINDER = "return_reminder"
    
    # Payment notifications
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_FAILED = "payment_failed"
    PAYMENT_DUE = "payment_due"
    INVOICE_ISSUED = "invoice_issued"
    
    # Vehicle notifications
    VEHICLE_MAINTENANCE_DUE = "vehicle_maintenance_due"
    VEHICLE_INSURANCE_EXPIRING = "vehicle_insurance_expiring"
    VEHICLE_CONTROL_EXPIRING = "vehicle_control_expiring"
    DAMAGE_REPORTED = "damage_reported"
    
    # Customer notifications
    CUSTOMER_CREATED = "customer_created"
    LICENSE_EXPIRING = "license_expiring"
    
    # System notifications
    SYSTEM_ALERT = "system_alert"
    SUBSCRIPTION_EXPIRING = "subscription_expiring"
    USER_ASSIGNED = "user_assigned"
    
    # Other
    OTHER = "other"


class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"  # Notification dans l'application
    PUSH = "push"  # Push notification


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """
    Système de notifications multi-canal
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=True, index=True)
    
    # Destinataire
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    
    # Type et canal
    notification_type = Column(String(50), nullable=False, index=True)
    channel = Column(String(20), nullable=False)
    priority = Column(String(20), default=NotificationPriority.NORMAL)
    
    # Contenu
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(1000), nullable=True)  # URL pour action (lien dans notif)
    
    # Référence à l'entité source
    entity_type = Column(String(50), nullable=True, index=True)  # booking, payment, vehicle, etc.
    entity_id = Column(String(100), nullable=True, index=True)
    
    # Métadonnées
    notification_metadata = Column(JSON, nullable=True)  # Données additionnelles
    
    # État
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime, nullable=True)
    
    # Envoi
    is_sent = Column(Boolean, default=False, index=True)
    sent_at = Column(DateTime, nullable=True)
    send_after = Column(DateTime, nullable=True)  # Pour programmation d'envoi
    
    # Email spécifique
    email_to = Column(String(255), nullable=True)
    email_subject = Column(String(500), nullable=True)
    email_sent = Column(Boolean, default=False)
    
    # SMS spécifique
    sms_to = Column(String(20), nullable=True)
    sms_sent = Column(Boolean, default=False)
    
    # Résultat d'envoi
    delivery_status = Column(String(50), nullable=True)  # delivered, failed, pending
    delivery_error = Column(Text, nullable=True)
    
    # Retry
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    next_retry_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="notifications")
    user = relationship("User", back_populates="notifications")
    customer = relationship("Customer", back_populates="notifications")
