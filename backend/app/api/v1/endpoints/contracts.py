"""
Contract endpoints with PDF generation and e-signature
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.contract import Contract, ContractStatus
from app.models.booking import Booking
from app.services.pdf_service import PDFContractService
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    ContractSignatureRequest
)

router = APIRouter()


@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    contract_data: ContractCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer un contrat pour une réservation
    """
    # Vérifier que la réservation existe
    booking = db.query(Booking).filter(
        Booking.id == contract_data.booking_id,
        Booking.agency_id == current_user.agency_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    
    # Vérifier qu'un contrat n'existe pas déjà
    existing_contract = db.query(Contract).filter(
        Contract.booking_id == contract_data.booking_id
    ).first()
    
    if existing_contract:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un contrat existe déjà pour cette réservation"
        )
    
    # Générer le numéro de contrat
    contract_number = f"CTR-{booking.booking_number.replace('RES-', '')}"
    
    # Créer le contrat
    new_contract = Contract(
        contract_number=contract_number,
        agency_id=current_user.agency_id,
        booking_id=contract_data.booking_id,
        terms_and_conditions=contract_data.terms_and_conditions,
        special_clauses=contract_data.special_clauses,
        status=ContractStatus.DRAFT
    )
    
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    
    return new_contract


@router.get("/", response_model=List[ContractResponse])
async def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Liste tous les contrats de l'agence
    """
    contracts = db.query(Contract).filter(
        Contract.agency_id == current_user.agency_id
    ).order_by(Contract.created_at.desc()).all()
    
    return contracts


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère un contrat spécifique
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.agency_id == current_user.agency_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé"
        )
    
    return contract


@router.get("/{contract_id}/pdf")
async def download_contract_pdf(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Télécharge le PDF du contrat
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.agency_id == current_user.agency_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé"
        )
    
    # Générer le PDF
    pdf_buffer = PDFContractService.generate_contract_pdf(db, contract)
    
    # Retourner le PDF
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=contract_{contract.contract_number}.pdf"
        }
    )


@router.post("/{contract_id}/generate-pdf", response_model=ContractResponse)
async def generate_contract_pdf(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Génère et sauvegarde le PDF du contrat
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.agency_id == current_user.agency_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé"
        )
    
    # Générer et sauvegarder le PDF
    filepath = PDFContractService.save_contract_pdf(db, contract_id)
    
    # Mettre à jour le statut
    contract.status = ContractStatus.PENDING_SIGNATURE
    db.commit()
    db.refresh(contract)
    
    return contract


@router.post("/{contract_id}/sign/customer", response_model=ContractResponse)
async def sign_contract_customer(
    contract_id: int,
    signature_data: ContractSignatureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Signature du contrat par le client (signature électronique)
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.agency_id == current_user.agency_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé"
        )
    
    if contract.status not in [ContractStatus.DRAFT, ContractStatus.PENDING_SIGNATURE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le contrat ne peut plus être signé"
        )
    
    # Enregistrer la signature client
    contract.customer_signature_data = signature_data.signature_data
    contract.customer_signed_at = datetime.utcnow()
    contract.customer_ip_address = signature_data.ip_address
    contract.customer_accepted_terms = True
    contract.accepted_terms_at = datetime.utcnow()
    
    # Mettre à jour le statut si les deux parties ont signé
    if contract.agent_signature_data:
        contract.status = ContractStatus.SIGNED
    else:
        contract.status = ContractStatus.PENDING_SIGNATURE
    
    db.commit()
    db.refresh(contract)
    
    return contract


@router.post("/{contract_id}/sign/agent", response_model=ContractResponse)
async def sign_contract_agent(
    contract_id: int,
    signature_data: ContractSignatureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Signature du contrat par l'agent de l'agence
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.agency_id == current_user.agency_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé"
        )
    
    if contract.status not in [ContractStatus.DRAFT, ContractStatus.PENDING_SIGNATURE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le contrat ne peut plus être signé"
        )
    
    # Enregistrer la signature agent
    contract.agent_signature_data = signature_data.signature_data
    contract.agent_signed_at = datetime.utcnow()
    contract.agent_id = current_user.id
    
    # Mettre à jour le statut si les deux parties ont signé
    if contract.customer_signature_data:
        contract.status = ContractStatus.SIGNED
    else:
        contract.status = ContractStatus.PENDING_SIGNATURE
    
    db.commit()
    db.refresh(contract)
    
    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: int,
    contract_update: ContractUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un contrat (uniquement si non signé)
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.agency_id == current_user.agency_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé"
        )
    
    if contract.status not in [ContractStatus.DRAFT]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de modifier un contrat en cours de signature ou signé"
        )
    
    # Mise à jour
    update_data = contract_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    
    return contract
