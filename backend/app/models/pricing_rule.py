"""
Pricing Rule model for dynamic pricing and yield management
"""
from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class PricingRuleType(str, Enum):
    BASE_RATE = "base_rate"  # Tarif de base
    SEASONAL = "seasonal"  # Tarif saisonnier
    WEEKEND = "weekend"  # Tarif week-end
    HOLIDAY = "holiday"  # Tarif jours fériés
    DURATION = "duration"  # Selon durée (long terme)
    ADVANCE_BOOKING = "advance_booking"  # Réservation anticipée
    LAST_MINUTE = "last_minute"  # Dernière minute
    DEMAND_BASED = "demand_based"  # Basé sur la demande


class PricingRuleStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SCHEDULED = "scheduled"


class PricingRule(Base):
    """
    Règles de tarification dynamique et yield management
    """
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    
    # Type et statut
    rule_type = Column(String(30), nullable=False, index=True)
    status = Column(String(20), default=PricingRuleStatus.ACTIVE, index=True)
    
    # Identification
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Priorité (pour résolution de conflits)
    priority = Column(Integer, default=0, index=True)  # Plus élevé = plus prioritaire
    
    # Période de validité
    valid_from = Column(Date, nullable=False, index=True)
    valid_to = Column(Date, nullable=False, index=True)
    
    # Jours applicables
    applies_monday = Column(Boolean, default=True)
    applies_tuesday = Column(Boolean, default=True)
    applies_wednesday = Column(Boolean, default=True)
    applies_thursday = Column(Boolean, default=True)
    applies_friday = Column(Boolean, default=True)
    applies_saturday = Column(Boolean, default=True)
    applies_sunday = Column(Boolean, default=True)
    
    # Véhicules applicables
    applies_to_all_vehicles = Column(Boolean, default=True)
    vehicle_categories = Column(ARRAY(String), nullable=True)  # Categories de véhicules
    specific_vehicle_ids = Column(JSON, nullable=True)  # IDs spécifiques
    
    # Conditions d'application
    min_rental_days = Column(Integer, nullable=True)
    max_rental_days = Column(Integer, nullable=True)
    min_advance_booking_days = Column(Integer, nullable=True)  # Réservation X jours avant
    max_advance_booking_days = Column(Integer, nullable=True)
    
    # Ajustement de prix
    adjustment_type = Column(String(20), nullable=False)  # percentage, fixed_amount, new_rate
    adjustment_value = Column(Numeric(10, 3), nullable=False)  # -20.00 pour -20%, 50.000 pour +50 TND
    
    # Tarif minimum/maximum (limites)
    minimum_daily_rate = Column(Numeric(10, 3), nullable=True)
    maximum_daily_rate = Column(Numeric(10, 3), nullable=True)
    
    # Conditions de demande (yield management)
    apply_when_occupancy_above = Column(Numeric(5, 2), nullable=True)  # Si occupation > X%
    apply_when_occupancy_below = Column(Numeric(5, 2), nullable=True)  # Si occupation < X%
    
    # Combinaison avec autres règles
    can_combine_with_other_rules = Column(Boolean, default=False)
    max_discount_percentage = Column(Numeric(5, 2), nullable=True)  # Limite cumul remises
    
    # Métadonnées
    rule_metadata = Column(JSON, nullable=True)
    
    # Suivi
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Statistiques d'utilisation
    times_applied = Column(Integer, default=0)
    total_revenue_impact = Column(Numeric(12, 3), default=0.000)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="pricing_rules")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
