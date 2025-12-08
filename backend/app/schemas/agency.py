from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.agency import SubscriptionPlan


# ============ Agency Schemas ============

class AgencyBase(BaseModel):
    """Base schema for Agency"""
    name: str = Field(..., min_length=1, max_length=255)
    legal_name: str = Field(..., min_length=1, max_length=255)
    tax_id: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=20)
    address: str = Field(..., min_length=1, max_length=500)
    city: str = Field(..., min_length=1, max_length=100)
    country: str = Field(default="Tunisia", max_length=100)


class AgencyCreate(AgencyBase):
    """Schema for creating a new agency"""
    subscription_plan: SubscriptionPlan = SubscriptionPlan.BASIQUE
    parent_agency_id: Optional[UUID] = None  # For creating branches


class AgencyUpdate(BaseModel):
    """Schema for updating an agency"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    legal_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    subscription_plan: Optional[SubscriptionPlan] = None
    is_active: Optional[bool] = None


class AgencyResponse(AgencyBase):
    """Schema for agency response"""
    id: UUID
    parent_agency_id: Optional[UUID] = None
    subscription_plan: SubscriptionPlan
    subscription_start_date: datetime
    subscription_end_date: Optional[datetime]
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AgencyWithFeatures(AgencyResponse):
    """Schema for agency response with available features"""
    available_features: list[str]
    
    model_config = ConfigDict(from_attributes=True)
