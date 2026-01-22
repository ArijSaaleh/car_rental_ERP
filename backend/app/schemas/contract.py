"""
Contract Pydantic schemas
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    booking_id: int = Field(..., description="ID de la réservation")
    terms_and_conditions: str = Field(..., description="Conditions Générales de Location")
    special_clauses: Optional[Dict[str, Any]] = Field(None, description="Clauses spécifiques")


class ContractUpdate(BaseModel):
    terms_and_conditions: Optional[str] = None
    special_clauses: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class ContractResponse(BaseModel):
    id: int
    contract_number: str
    agency_id: UUID
    booking_id: int
    status: str
    pdf_url: Optional[str] = None
    pdf_storage_path: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    customer_signature_data: Optional[str] = None
    customer_signed_at: Optional[datetime] = None
    customer_ip_address: Optional[str] = None
    agent_signature_data: Optional[str] = None
    agent_signed_at: Optional[datetime] = None
    agent_id: Optional[UUID] = None
    terms_and_conditions: str
    customer_accepted_terms: bool
    accepted_terms_at: Optional[datetime] = None
    special_clauses: Optional[Dict[str, Any]] = None
    timbre_fiscal_amount: str
    contract_language: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContractSignatureRequest(BaseModel):
    signature_data: str = Field(..., description="Données de la signature (Base64)")
    ip_address: Optional[str] = Field(None, description="Adresse IP du signataire")
