"""
Review model for customer feedback and ratings
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReviewStatus(str, Enum):
    PENDING = "pending"  # En attente de modération
    APPROVED = "approved"  # Approuvé
    REJECTED = "rejected"  # Rejeté
    FLAGGED = "flagged"  # Signalé


class Review(Base):
    """
    Avis et évaluations clients
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True, index=True)
    
    # Évaluations (sur 5 étoiles)
    overall_rating = Column(Float, nullable=False, index=True)  # Note globale
    vehicle_condition_rating = Column(Float, nullable=True)  # État du véhicule
    service_quality_rating = Column(Float, nullable=True)  # Qualité du service
    value_for_money_rating = Column(Float, nullable=True)  # Rapport qualité-prix
    cleanliness_rating = Column(Float, nullable=True)  # Propreté
    
    # Commentaires
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)
    
    # Recommandation
    would_recommend = Column(Boolean, nullable=True)
    
    # Statut et modération
    status = Column(String(20), default=ReviewStatus.PENDING, index=True)
    is_verified = Column(Boolean, default=False)  # Client vérifié (a bien loué)
    is_public = Column(Boolean, default=True)  # Visible publiquement
    
    # Modération
    moderated_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    moderation_notes = Column(Text, nullable=True)
    
    # Réponse de l'agence
    agency_response = Column(Text, nullable=True)
    agency_responded_at = Column(DateTime, nullable=True)
    agency_responded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Signalement
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(Text, nullable=True)
    flagged_at = Column(DateTime, nullable=True)
    
    # Statistiques d'utilité
    helpful_count = Column(Integer, default=0)  # "Cet avis était-il utile?"
    not_helpful_count = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")
    customer = relationship("Customer", back_populates="reviews")
    vehicle = relationship("Vehicle", back_populates="reviews")
    moderated_by = relationship("User", foreign_keys=[moderated_by_user_id])
    agency_responded_by = relationship("User", foreign_keys=[agency_responded_by_user_id])
