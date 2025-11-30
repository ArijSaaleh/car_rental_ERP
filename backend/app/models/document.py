"""
Document model for file management
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, BigInteger, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class DocumentType(str, Enum):
    # Vehicle documents
    VEHICLE_REGISTRATION = "vehicle_registration"  # Carte grise
    INSURANCE_POLICY = "insurance_policy"  # Police d'assurance
    TECHNICAL_CONTROL = "technical_control"  # Contrôle technique
    VEHICLE_PHOTO = "vehicle_photo"
    
    # Customer documents
    CUSTOMER_ID = "customer_id"  # CIN
    DRIVERS_LICENSE = "drivers_license"  # Permis de conduire
    CUSTOMER_PHOTO = "customer_photo"
    
    # Contract documents
    SIGNED_CONTRACT = "signed_contract"
    
    # Damage documents
    DAMAGE_PHOTO = "damage_photo"
    POLICE_REPORT = "police_report"  # Constat amiable
    REPAIR_INVOICE = "repair_invoice"
    
    # Financial documents
    INVOICE = "invoice"
    RECEIPT = "receipt"
    
    # Other
    OTHER = "other"


class Document(Base):
    """
    Gestion documentaire pour tous les types de fichiers
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relations multi-tenant
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=False, index=True)
    
    # Type et catégorie
    document_type = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=True, index=True)  # vehicle, customer, booking, etc.
    
    # Relations polymorphiques (référence flexible)
    entity_type = Column(String(50), nullable=True, index=True)  # vehicle, customer, booking, etc.
    entity_id = Column(String(100), nullable=True, index=True)  # ID de l'entité
    
    # Relations spécifiques (optionnelles)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True, index=True)
    
    # Informations du fichier
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Chemin stockage
    file_url = Column(String(1000), nullable=True)  # URL publique si applicable
    
    # Métadonnées fichier
    file_size = Column(BigInteger, nullable=True)  # Taille en octets
    mime_type = Column(String(100), nullable=True)
    file_extension = Column(String(10), nullable=True)
    
    # OCR et contenu (pour recherche)
    ocr_text = Column(Text, nullable=True)  # Texte extrait par OCR
    is_ocr_processed = Column(Boolean, default=False)
    
    # Dates importantes
    document_date = Column(DateTime, nullable=True)  # Date du document
    expiry_date = Column(DateTime, nullable=True)  # Date d'expiration si applicable
    
    # Sécurité et accès
    is_public = Column(Boolean, default=False)
    is_confidential = Column(Boolean, default=False)
    password_protected = Column(Boolean, default=False)
    
    # Validation
    is_verified = Column(Boolean, default=False)
    verified_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Métadonnées
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    
    # Suivi
    uploaded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    agency = relationship("Agency", back_populates="documents")
    vehicle = relationship("Vehicle", back_populates="documents")
    customer = relationship("Customer", back_populates="documents")
    booking = relationship("Booking", back_populates="documents")
    contract = relationship("Contract", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_user_id])
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])
