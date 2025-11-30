"""
Admin schemas for super admin operations
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.agency import SubscriptionPlan


# Agency Onboarding
class AgencyOnboardingRequest(BaseModel):
    # Agency details
    agency_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=20)
    address: str
    city: str
    postal_code: str
    country: str = "Tunisia"
    tax_id: Optional[str] = None
    
    # Owner details
    owner_full_name: str = Field(..., min_length=2, max_length=255)
    owner_email: EmailStr
    owner_phone: str = Field(..., min_length=8, max_length=20)
    owner_password: str = Field(..., min_length=8)
    
    # Subscription
    subscription_plan: SubscriptionPlan = SubscriptionPlan.BASIQUE
    trial_days: int = Field(default=14, ge=0, le=90)


class AgencyOnboardingResponse(BaseModel):
    agency_id: str
    agency_name: str
    owner_id: str
    owner_email: str
    subscription_plan: str
    trial_ends_at: Optional[datetime]
    message: str
    
    class Config:
        from_attributes = True


# Platform Statistics
class PlatformStats(BaseModel):
    total_agencies: int
    active_agencies: int
    total_users: int
    total_vehicles: int
    total_customers: int
    total_bookings: int
    total_revenue: float
    active_bookings: int
    
    # Plan breakdown
    agencies_by_plan: dict


class AgencyHealthStatus(BaseModel):
    agency_id: str
    agency_name: str
    is_active: bool
    subscription_plan: str
    total_users: int
    total_vehicles: int
    total_bookings: int
    last_booking_date: Optional[datetime]
    health_score: float  # 0-100
    status: str  # healthy, warning, critical, inactive


# Subscription Management
class SubscriptionChangeRequest(BaseModel):
    agency_id: str
    new_plan: SubscriptionPlan
    reason: Optional[str] = None
    effective_date: Optional[datetime] = None


class SubscriptionChangeResponse(BaseModel):
    agency_id: str
    previous_plan: str
    new_plan: str
    changed_at: datetime
    changed_by: str
    message: str


# Bulk Operations
class BulkAgencyOperation(BaseModel):
    agency_ids: List[str]
    action: str  # deactivate, activate, notify
    reason: Optional[str] = None


class BulkOperationResult(BaseModel):
    total_requested: int
    successful: int
    failed: int
    results: List[dict]


# Audit Log
class AuditLogEntry(BaseModel):
    id: str
    admin_id: str
    admin_email: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: dict
    ip_address: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AuditLogFilter(BaseModel):
    admin_id: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)


# Revenue Report
class RevenueByAgency(BaseModel):
    agency_id: str
    agency_name: str
    total_revenue: float
    total_bookings: int
    avg_booking_value: float
    subscription_plan: str


class PlatformRevenueReport(BaseModel):
    total_revenue: float
    period_start: datetime
    period_end: datetime
    agencies: List[RevenueByAgency]
    revenue_by_plan: dict


# User Management
class CreateAgencyOwner(BaseModel):
    agency_id: str
    email: EmailStr
    full_name: str
    phone: str
    password: str = Field(..., min_length=8)


class UserManagementAction(BaseModel):
    user_id: str
    action: str  # reset_password, deactivate, activate, delete
    new_password: Optional[str] = None
    reason: Optional[str] = None
