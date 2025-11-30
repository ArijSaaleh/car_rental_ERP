"""
Customer schemas for API validation
"""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CustomerBase(BaseModel):
    """Base customer schema"""
    customer_type: str = Field(..., pattern="^(individual|company)$")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=20)
    license_number: str = Field(..., min_length=1, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    country: str = Field(default="Tunisia", max_length=100)
    
    # Individual fields
    cin_number: Optional[str] = Field(None, min_length=8, max_length=20)
    cin_issue_date: Optional[date] = None
    cin_expiry_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    place_of_birth: Optional[str] = Field(None, max_length=100)
    
    # License fields
    license_issue_date: Optional[date] = None
    license_expiry_date: Optional[date] = None
    license_category: Optional[str] = Field(None, max_length=20)
    
    # Company fields
    company_name: Optional[str] = Field(None, max_length=200)
    company_tax_id: Optional[str] = Field(None, max_length=50)
    company_registry_number: Optional[str] = Field(None, max_length=50)
    
    # Notes
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Schema for creating a customer"""
    pass


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    customer_type: Optional[str] = Field(None, pattern="^(individual|company)$")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=8, max_length=20)
    license_number: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, max_length=100)
    
    cin_number: Optional[str] = Field(None, min_length=8, max_length=20)
    cin_issue_date: Optional[date] = None
    cin_expiry_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    place_of_birth: Optional[str] = Field(None, max_length=100)
    
    license_issue_date: Optional[date] = None
    license_expiry_date: Optional[date] = None
    license_category: Optional[str] = Field(None, max_length=20)
    
    company_name: Optional[str] = Field(None, max_length=200)
    company_tax_id: Optional[str] = Field(None, max_length=50)
    company_registry_number: Optional[str] = Field(None, max_length=50)
    
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    """Schema for customer response"""
    id: int
    agency_id: str
    is_active: bool
    is_blacklisted: bool
    blacklist_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
