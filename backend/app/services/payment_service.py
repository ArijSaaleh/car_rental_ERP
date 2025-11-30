"""
Payment Service with support for Tunisian payment gateways
"""
import hashlib
import hmac
import json
from datetime import datetime
from typing import Dict, Any, Optional
from decimal import Decimal

import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import Payment, PaymentMethod, PaymentType, PaymentStatus
from app.models.booking import Booking
from app.core.config import settings


class PaymentGatewayService:
    """
    Service pour les passerelles de paiement tunisiennes et internationales
    """
    
    @staticmethod
    def generate_payment_reference(booking_id: int) -> str:
        """
        Génère une référence de paiement unique
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"PAY-{booking_id}-{timestamp}"
    
    
    @staticmethod
    def create_payment(
        db: Session,
        booking_id: int,
        amount: Decimal,
        payment_method: str,
        payment_type: str = PaymentType.RENTAL_FEE,
        gateway: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Payment:
        """
        Crée un enregistrement de paiement
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Réservation non trouvée"
            )
        
        payment_reference = PaymentGatewayService.generate_payment_reference(booking_id)
        
        payment = Payment(
            payment_reference=payment_reference,
            agency_id=booking.agency_id,
            booking_id=booking_id,
            payment_method=payment_method,
            payment_type=payment_type,
            amount=amount,
            currency="TND",
            gateway=gateway,
            status=PaymentStatus.PENDING,
            processed_by_user_id=user_id
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return payment
    
    
    @staticmethod
    def initiate_paymee_payment(
        payment: Payment,
        return_url: str,
        cancel_url: str,
        webhook_url: str,
        vendor_token: str
    ) -> Dict[str, Any]:
        """
        Initie un paiement Paymee (Tunisie)
        
        Documentation: https://paymee.tn/docs
        """
        paymee_api_url = "https://app.paymee.tn/api/v2/payments/create"
        
        payload = {
            "vendor": vendor_token,
            "amount": int(float(payment.amount) * 1000),  # Paymee utilise les millimes
            "note": f"Paiement réservation {payment.booking_id}",
            "first_name": "",  # À remplir avec les infos client
            "last_name": "",
            "email": "",
            "phone": "",
            "return_url": return_url,
            "cancel_url": cancel_url,
            "webhook_url": webhook_url,
            "order_id": payment.payment_reference
        }
        
        try:
            response = requests.post(
                paymee_api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "payment_url": data.get("data", {}).get("payment_url"),
                "token": data.get("data", {}).get("token"),
                "gateway_response": data
            }
            
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Erreur lors de la connexion à Paymee: {str(e)}"
            )
    
    
    @staticmethod
    def verify_paymee_webhook(
        payload: Dict[str, Any],
        signature: str,
        secret_key: str
    ) -> bool:
        """
        Vérifie la signature du webhook Paymee
        """
        # Créer la signature attendue
        payload_string = json.dumps(payload, separators=(',', ':'), sort_keys=True)
        expected_signature = hmac.new(
            secret_key.encode(),
            payload_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    
    @staticmethod
    def process_paymee_webhook(
        db: Session,
        payment_reference: str,
        webhook_data: Dict[str, Any]
    ) -> Payment:
        """
        Traite le webhook de confirmation Paymee
        """
        payment = db.query(Payment).filter(
            Payment.payment_reference == payment_reference
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paiement non trouvé"
            )
        
        # Mettre à jour le paiement selon le statut Paymee
        paymee_status = webhook_data.get("payment_status")
        
        if paymee_status == "paid":
            payment.status = PaymentStatus.COMPLETED
            payment.paid_at = datetime.utcnow()
        elif paymee_status == "failed":
            payment.status = PaymentStatus.FAILED
        elif paymee_status == "cancelled":
            payment.status = PaymentStatus.CANCELLED
        
        payment.gateway_transaction_id = webhook_data.get("payment_id")
        payment.gateway_response = webhook_data
        payment.webhook_received_at = datetime.utcnow()
        
        # Calculer les frais de la passerelle (Paymee: ~3%)
        if payment.status == PaymentStatus.COMPLETED:
            payment.gateway_fee = float(payment.amount) * 0.03
        
        db.commit()
        db.refresh(payment)
        
        # Mettre à jour le statut de paiement de la réservation
        if payment.status == PaymentStatus.COMPLETED:
            booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
            if booking:
                booking.payment_status = "paid"
                db.commit()
        
        return payment
    
    
    @staticmethod
    def initiate_clictopay_payment(
        payment: Payment,
        return_url: str,
        merchant_id: str,
        secret_key: str
    ) -> Dict[str, Any]:
        """
        Initie un paiement ClicToPay (Tunisie - Banques tunisiennes)
        
        Note: ClicToPay nécessite une intégration bancaire spécifique
        Cette implémentation est un exemple générique
        """
        clictopay_api_url = "https://gateway.clictopay.com/payment/init"
        
        # Créer la signature
        amount_str = f"{int(float(payment.amount) * 1000):012d}"
        signature_string = f"{merchant_id}{payment.payment_reference}{amount_str}{secret_key}"
        signature = hashlib.sha256(signature_string.encode()).hexdigest()
        
        payload = {
            "merchantId": merchant_id,
            "orderId": payment.payment_reference,
            "amount": amount_str,
            "currency": "788",  # Code ISO 4217 pour TND
            "returnUrl": return_url,
            "signature": signature
        }
        
        try:
            response = requests.post(
                clictopay_api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "payment_url": data.get("redirectUrl"),
                "session_id": data.get("sessionId"),
                "gateway_response": data
            }
            
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Erreur lors de la connexion à ClicToPay: {str(e)}"
            )
    
    
    @staticmethod
    def record_cash_payment(
        db: Session,
        payment: Payment,
        user_id: int
    ) -> Payment:
        """
        Enregistre un paiement en espèces
        """
        payment.status = PaymentStatus.COMPLETED
        payment.paid_at = datetime.utcnow()
        payment.processed_by_user_id = user_id
        payment.gateway = None
        
        db.commit()
        db.refresh(payment)
        
        # Mettre à jour la réservation
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.payment_status = "paid"
            db.commit()
        
        return payment
    
    
    @staticmethod
    def get_payment_stats(db: Session, agency_id: int) -> Dict[str, Any]:
        """
        Récupère les statistiques de paiement pour une agence
        """
        from sqlalchemy import func
        
        total_payments = db.query(func.sum(Payment.amount)).filter(
            Payment.agency_id == agency_id,
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        payment_count = db.query(func.count(Payment.id)).filter(
            Payment.agency_id == agency_id,
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        pending_payments = db.query(func.sum(Payment.amount)).filter(
            Payment.agency_id == agency_id,
            Payment.status == PaymentStatus.PENDING
        ).scalar() or 0
        
        return {
            "total_revenue": float(total_payments),
            "completed_payments": payment_count,
            "pending_amount": float(pending_payments)
        }
