"""
Contract endpoints with PDF generation and e-signature
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_agency_access
from app.models.user import User, UserRole
from app.models.agency import Agency
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
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a contract for a booking
    
    Role-based access:
    - Manager/Employees: Can create contracts in their assigned agency
    - Proprietaire/Super Admin: Must provide agency_id parameter
    """
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:  # type: ignore
        if not current_user.agency_id:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id  # type: ignore
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify agency access
    await verify_agency_access(current_user, target_agency_id, db)
    
    # Check that the booking exists
    booking = db.query(Booking).filter(
        Booking.id == contract_data.booking_id,
        Booking.agency_id == target_agency_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check that a contract doesn't already exist
    existing_contract = db.query(Contract).filter(
        Contract.booking_id == contract_data.booking_id
    ).first()
    
    if existing_contract:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A contract already exists for this booking"
        )
    
    # Generate contract number
    contract_number = f"CTR-{booking.booking_number.replace('RES-', '')}"
    
    # Create contract
    new_contract = Contract(
        contract_number=contract_number,
        agency_id=target_agency_id,
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
    agency_id: Optional[UUID] = Query(None, description="Agency ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all contracts
    
    Role-based access:
    - Manager/Employees: Auto-use their assigned agency
    - Proprietaire/Super Admin: Must provide agency_id parameter
    """
    # Determine target agency
    target_agency_id = agency_id
    
    if current_user.role in [UserRole.MANAGER, UserRole.AGENT_COMPTOIR, UserRole.AGENT_PARC]:  # type: ignore
        if not current_user.agency_id:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not assigned to an agency"
            )
        target_agency_id = current_user.agency_id  # type: ignore
    else:
        if not target_agency_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agency_id parameter is required"
            )
    
    # Verify agency access
    await verify_agency_access(current_user, target_agency_id, db)
    
    contracts = db.query(Contract).filter(
        Contract.agency_id == target_agency_id
    ).order_by(Contract.created_at.desc()).all()
    
    return contracts


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific contract
    
    Role-based access:
    - Automatically verifies user has access to the contract's agency
    """
    # Get contract first to determine its agency
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access to the contract's agency
    await verify_agency_access(current_user, contract.agency_id, db)
    
    return contract


@router.get("/{contract_id}/pdf")
async def download_contract_pdf(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download the contract PDF
    
    Role-based access:
    - Automatically verifies user has access to the contract's agency
    """
    # Get contract first to determine its agency
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access to the contract's agency
    await verify_agency_access(current_user, contract.agency_id, db)
    
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
    Generate and save the contract PDF
    
    Role-based access:
    - Automatically verifies user has access to the contract's agency
    """
    # Get contract first to determine its agency
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access to the contract's agency
    await verify_agency_access(current_user, contract.agency_id, db)
    
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
    Customer contract signature (electronic signature)
    
    Role-based access:
    - Automatically verifies user has access to the contract's agency
    """
    # Get contract first to determine its agency
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access to the contract's agency
    await verify_agency_access(current_user, contract.agency_id, db)
    
    if contract.status not in [ContractStatus.DRAFT, ContractStatus.PENDING_SIGNATURE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract can no longer be signed"
        )
    
    # Record customer signature
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
    Agent contract signature
    
    Role-based access:
    - Automatically verifies user has access to the contract's agency
    """
    # Get contract first to determine its agency
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access to the contract's agency
    await verify_agency_access(current_user, contract.agency_id, db)
    
    if contract.status not in [ContractStatus.DRAFT, ContractStatus.PENDING_SIGNATURE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract can no longer be signed"
        )
    
    # Record agent signature
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
    Update a contract (only if not signed)
    
    Role-based access:
    - Automatically verifies user has access to the contract's agency
    """
    # Get contract first to determine its agency
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access to the contract's agency
    await verify_agency_access(current_user, contract.agency_id, db)
    
    if contract.status not in [ContractStatus.DRAFT]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a contract that is being signed or already signed"
        )
    
    # Mise à jour
    update_data = contract_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    
    return contract
