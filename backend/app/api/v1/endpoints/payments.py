"""
Payment endpoints with Tunisian gateway integration
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.services.payment_service import PaymentGatewayService
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentWebhookPaymee,
    PaymentInitResponse
)

router = APIRouter()


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau paiement
    """
    payment = PaymentGatewayService.create_payment(
        db=db,
        booking_id=payment_data.booking_id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        payment_type=payment_data.payment_type,
        gateway=payment_data.gateway,
        user_id=current_user.id
    )
    
    return payment


@router.post("/{payment_id}/initiate/paymee", response_model=PaymentInitResponse)
async def initiate_paymee(
    payment_id: int,
    return_url: str,
    cancel_url: str,
    webhook_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initie un paiement via Paymee
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.agency_id == current_user.agency_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    
    # TODO: Récupérer le token Paymee depuis les settings de l'agence
    vendor_token = "YOUR_PAYMEE_VENDOR_TOKEN"
    
    result = PaymentGatewayService.initiate_paymee_payment(
        payment=payment,
        return_url=return_url,
        cancel_url=cancel_url,
        webhook_url=webhook_url,
        vendor_token=vendor_token
    )
    
    # Mettre à jour le paiement
    payment.status = PaymentStatus.PROCESSING
    payment.gateway = "paymee"
    payment.callback_url = return_url
    db.commit()
    
    return PaymentInitResponse(
        payment_id=payment.id,
        payment_url=result["payment_url"],
        token=result.get("token"),
        gateway="paymee"
    )


@router.post("/webhook/paymee")
async def paymee_webhook(
    request: Request,
    webhook_data: PaymentWebhookPaymee,
    db: Session = Depends(get_db)
):
    """
    Webhook de confirmation Paymee
    """
    # TODO: Vérifier la signature du webhook
    # signature = request.headers.get("X-Paymee-Signature")
    # secret_key = "YOUR_PAYMEE_SECRET_KEY"
    # is_valid = PaymentGatewayService.verify_paymee_webhook(
    #     webhook_data.dict(), signature, secret_key
    # )
    # if not is_valid:
    #     raise HTTPException(status_code=403, detail="Invalid signature")
    
    payment = PaymentGatewayService.process_paymee_webhook(
        db=db,
        payment_reference=webhook_data.order_id,
        webhook_data=webhook_data.model_dump()
    )
    
    return {"status": "ok", "payment_id": payment.id}


@router.post("/{payment_id}/confirm-cash", response_model=PaymentResponse)
async def confirm_cash_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirme un paiement en espèces
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.agency_id == current_user.agency_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    
    if payment.payment_method != PaymentMethod.CASH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce paiement n'est pas un paiement en espèces"
        )
    
    payment = PaymentGatewayService.record_cash_payment(
        db=db,
        payment=payment,
        user_id=current_user.id
    )
    
    return payment


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Liste tous les paiements de l'agence
    """
    payments = db.query(Payment).filter(
        Payment.agency_id == current_user.agency_id
    ).order_by(Payment.created_at.desc()).all()
    
    return payments


@router.get("/stats")
async def get_payment_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques de paiement
    """
    stats = PaymentGatewayService.get_payment_stats(db, current_user.agency_id)
    return stats


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère un paiement spécifique
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.agency_id == current_user.agency_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    
    return payment
