from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.vehicle import VehicleStatus, FuelType, TransmissionType


# ============ Vehicle Schemas ============

class VehicleBase(BaseModel):
    """Base schema for Vehicle"""
    license_plate: str = Field(..., min_length=1, max_length=20)
    vin: Optional[str] = Field(None, max_length=17)
    brand: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    color: Optional[str] = Field(None, max_length=50)
    fuel_type: FuelType
    transmission: TransmissionType
    seats: int = Field(default=5, ge=1, le=50)
    doors: int = Field(default=4, ge=1, le=10)
    mileage: int = Field(default=0, ge=0)
    status: VehicleStatus = VehicleStatus.DISPONIBLE
    registration_number: Optional[str] = Field(None, max_length=50)
    insurance_policy: Optional[str] = Field(None, max_length=100)
    insurance_expiry: Optional[datetime] = None
    technical_control_expiry: Optional[datetime] = None
    daily_rate: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle"""
    pass


class VehicleUpdate(BaseModel):
    """Schema for updating a vehicle"""
    license_plate: Optional[str] = Field(None, min_length=1, max_length=20)
    vin: Optional[str] = Field(None, max_length=17)
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    color: Optional[str] = Field(None, max_length=50)
    fuel_type: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    seats: Optional[int] = Field(None, ge=1, le=50)
    doors: Optional[int] = Field(None, ge=1, le=10)
    mileage: Optional[int] = Field(None, ge=0)
    status: Optional[VehicleStatus] = None
    registration_number: Optional[str] = Field(None, max_length=50)
    insurance_policy: Optional[str] = Field(None, max_length=100)
    insurance_expiry: Optional[datetime] = None
    technical_control_expiry: Optional[datetime] = None
    daily_rate: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class VehicleResponse(VehicleBase):
    """Schema for vehicle response"""
    id: UUID
    agency_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class VehicleListResponse(BaseModel):
    """Schema for paginated vehicle list response"""
    total: int
    vehicles: list[VehicleResponse]
    page: int
    page_size: int
    
    model_config = ConfigDict(from_attributes=True)
