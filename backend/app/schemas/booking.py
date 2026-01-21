"""
Booking Pydantic schemas
"""
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal


class BookingCreate(BaseModel):
    vehicle_id: UUID = Field(..., description="ID du véhicule")
    customer_id: int = Field(..., description="ID du client")
    start_date: date = Field(..., description="Date de début de location")
    end_date: date = Field(..., description="Date de fin de location")
    daily_rate: Optional[Decimal] = Field(None, description="Tarif journalier personnalisé")
    deposit_amount: Optional[Decimal] = Field(0.0, description="Montant de la caution")
    mileage_limit: Optional[int] = Field(None, description="Limite de kilométrage")
    extra_mileage_rate: Optional[Decimal] = Field(None, description="Tarif par km supplémentaire")
    fuel_policy: Optional[str] = Field("full_to_full", description="Politique de carburant")
    notes: Optional[str] = Field(None, description="Notes de réservation")
    
    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('La date de fin doit être après la date de début')
        return v


class BookingUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    initial_mileage: Optional[int] = None
    final_mileage: Optional[int] = None
    initial_fuel_level: Optional[str] = None
    final_fuel_level: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    booking_number: str
    agency_id: UUID
    vehicle_id: UUID
    customer_id: int
    created_by_user_id: UUID
    start_date: date
    end_date: date
    pickup_datetime: Optional[datetime] = None
    return_datetime: Optional[datetime] = None
    daily_rate: Decimal
    duration_days: int
    subtotal: Decimal
    tax_amount: Decimal
    timbre_fiscal: Decimal
    total_amount: Decimal
    deposit_amount: Decimal
    status: str
    payment_status: str
    initial_mileage: Optional[int] = None
    final_mileage: Optional[int] = None
    mileage_limit: Optional[int] = None
    extra_mileage_rate: Optional[Decimal] = None
    initial_fuel_level: Optional[str] = None
    final_fuel_level: Optional[str] = None
    fuel_policy: str
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VehicleAvailabilityRequest(BaseModel):
    vehicle_id: UUID
    start_date: date
    end_date: date


class VehicleAvailabilityResponse(BaseModel):
    available: bool
    vehicle_id: UUID
    start_date: date
    end_date: date
    conflicts: List[Dict[str, Any]] = []
    pricing: Optional[Dict[str, Any]] = None
