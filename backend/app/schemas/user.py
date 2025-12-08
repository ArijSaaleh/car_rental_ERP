from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


# ============ User Schemas ============

class UserBase(BaseModel):
    """Base schema for User"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = None
    role: UserRole = UserRole.AGENT_COMPTOIR


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    agency_id: Optional[UUID] = None  # Required for non-super-admin users, set by backend based on creator's role


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class AdminUserUpdate(BaseModel):
    """Schema for admin updating any user (can change role)"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    agency_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)


class UserChangePassword(BaseModel):
    """Schema for changing user password"""
    current_password: str = Field(..., min_length=8, max_length=100)
    new_password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    """Schema for user response"""
    id: UUID
    agency_id: Optional[UUID]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


# ============ Token Schemas ============

class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None
    agency_id: Optional[UUID] = None
