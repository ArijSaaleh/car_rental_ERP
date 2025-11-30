"""
Payment Pydantic schemas
"""
from datetime import datetime
from typing import Optional, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    booking_id: int = Field(..., description="ID de la réservation")
    amount: Decimal = Field(..., description="Montant du paiement")
    payment_method: str = Field(..., description="Méthode de paiement (cash, card, paymee, clictopay)")
    payment_type: str = Field("rental_fee", description="Type de paiement")
    gateway: Optional[str] = Field(None, description="Passerelle de paiement")


class PaymentResponse(BaseModel):
    id: int
    payment_reference: str
    agency_id: int
    booking_id: int
    payment_method: str
    payment_type: str
    amount: Decimal
    currency: str
    status: str
    gateway: Optional[str] = None
    gateway_transaction_id: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None
    gateway_fee: Decimal
    webhook_received_at: Optional[datetime] = None
    callback_url: Optional[str] = None
    card_last4: Optional[str] = None
    card_brand: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    processed_by_user_id: Optional[int] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaymentInitResponse(BaseModel):
    payment_id: int
    payment_url: str
    token: Optional[str] = None
    gateway: str


class PaymentWebhookPaymee(BaseModel):
    """
    Webhook Paymee pour confirmation de paiement
    """
    payment_id: str
    order_id: str
    payment_status: str
    amount: int
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None
