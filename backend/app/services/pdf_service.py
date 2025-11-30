"""
PDF Contract Generation Service using ReportLab
Generates rental contracts with Tunisian legal requirements
"""
from datetime import datetime
from typing import Dict, Any, Optional
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.contract import Contract
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.agency import Agency


class PDFContractService:
    """
    Service de génération de contrats PDF conformes à la législation tunisienne
    """
    
    @staticmethod
    def generate_contract_pdf(
        db: Session,
        contract: Contract,
        output_path: Optional[str] = None
    ) -> BytesIO:
        """
        Génère un PDF du contrat de location
        
        Args:
            db: Session de base de données
            contract: Objet Contract
            output_path: Chemin de sauvegarde optionnel
        
        Returns:
            BytesIO contenant le PDF
        """
        # Récupérer les données liées
        booking = db.query(Booking).filter(Booking.id == contract.booking_id).first()
        customer = db.query(Customer).filter(Customer.id == booking.customer_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        agency = db.query(Agency).filter(Agency.id == contract.agency_id).first()
        
        # Créer le buffer PDF
        buffer = BytesIO()
        
        # Créer le document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#333333'),
            spaceAfter=6,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#000000'),
            alignment=TA_LEFT
        )
        
        # Contenu du document
        story = []
        
        # En-tête
        story.append(Paragraph(f"<b>{agency.name}</b>", title_style))
        story.append(Paragraph(f"{agency.address}, {agency.city}", normal_style))
        story.append(Paragraph(f"Tél: {agency.phone} - Email: {agency.email}", normal_style))
        story.append(Paragraph(f"Matricule Fiscal: {agency.tax_id}", normal_style))
        story.append(Spacer(1, 1*cm))
        
        # Titre du contrat
        story.append(Paragraph("<b>CONTRAT DE LOCATION DE VÉHICULE</b>", title_style))
        story.append(Paragraph(f"N° {contract.contract_number}", heading_style))
        story.append(Spacer(1, 0.5*cm))
        
        # Informations de la réservation
        booking_data = [
            ["Date du contrat:", datetime.now().strftime("%d/%m/%Y %H:%M")],
            ["Numéro de réservation:", booking.booking_number],
            ["Période de location:", f"Du {booking.start_date.strftime('%d/%m/%Y')} au {booking.end_date.strftime('%d/%m/%Y')}"],
            ["Durée:", f"{booking.duration_days} jour(s)"],
        ]
        
        booking_table = Table(booking_data, colWidths=[6*cm, 10*cm])
        booking_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(booking_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Informations du locataire
        story.append(Paragraph("<b>LOCATAIRE</b>", heading_style))
        customer_data = [
            ["Nom et Prénom:", f"{customer.first_name} {customer.last_name}"],
            ["Type:", "Particulier" if customer.customer_type == "individual" else "Entreprise"],
            ["CIN:", customer.cin_number or "N/A"],
            ["Permis de conduire:", customer.license_number],
            ["Adresse:", f"{customer.address}, {customer.city}" if customer.address else "N/A"],
            ["Téléphone:", customer.phone],
            ["Email:", customer.email],
        ]
        
        if customer.customer_type == "company":
            customer_data.insert(2, ["Raison sociale:", customer.company_name or "N/A"])
            customer_data.insert(3, ["Matricule fiscal:", customer.company_tax_id or "N/A"])
        
        customer_table = Table(customer_data, colWidths=[5*cm, 11*cm])
        customer_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(customer_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Informations du véhicule
        story.append(Paragraph("<b>VÉHICULE LOUÉ</b>", heading_style))
        vehicle_data = [
            ["Marque et Modèle:", f"{vehicle.brand} {vehicle.model}"],
            ["Immatriculation:", vehicle.license_plate],
            ["Année:", str(vehicle.year)],
            ["Carburant:", vehicle.fuel_type.value],
            ["Transmission:", vehicle.transmission.value],
            ["Kilométrage départ:", f"{booking.initial_mileage or 'N/A'} km"],
        ]
        
        vehicle_table = Table(vehicle_data, colWidths=[5*cm, 11*cm])
        vehicle_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(vehicle_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Conditions financières
        story.append(Paragraph("<b>CONDITIONS FINANCIÈRES</b>", heading_style))
        financial_data = [
            ["Tarif journalier:", f"{float(booking.daily_rate):.3f} TND"],
            ["Durée:", f"{booking.duration_days} jour(s)"],
            ["Sous-total:", f"{float(booking.subtotal):.3f} TND"],
            ["TVA:", f"{float(booking.tax_amount):.3f} TND"],
            ["<b>Timbre Fiscal</b>:", f"<b>{float(booking.timbre_fiscal):.3f} TND</b>"],
            ["<b>TOTAL</b>:", f"<b>{float(booking.total_amount):.3f} TND</b>"],
            ["Caution:", f"{float(booking.deposit_amount):.3f} TND"],
        ]
        
        financial_table = Table(financial_data, colWidths=[10*cm, 6*cm])
        financial_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -5), 'Helvetica'),
            ('FONTNAME', (0, -4), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, -2), (-1, -1), colors.HexColor('#f0f0f0')),
        ]))
        
        story.append(financial_table)
        story.append(Spacer(1, 0.7*cm))
        
        # Conditions Générales de Location
        story.append(PageBreak())
        story.append(Paragraph("<b>CONDITIONS GÉNÉRALES DE LOCATION</b>", heading_style))
        story.append(Spacer(1, 0.3*cm))
        
        # CGL (À personnaliser par l'agence)
        cgl_text = contract.terms_and_conditions or """
        1. Le locataire s'engage à utiliser le véhicule conformément à sa destination normale.
        2. Le véhicule doit être restitué avec le même niveau de carburant qu'au départ.
        3. Toute franchise kilométrique dépassée sera facturée selon le tarif en vigueur.
        4. Le locataire est responsable des amendes et infractions commises durant la location.
        5. La caution sera restituée après inspection du véhicule et sous réserve de dommages.
        6. Le locataire s'engage à souscrire une assurance couvrant les dommages au véhicule.
        7. En cas de panne, le locataire doit contacter immédiatement l'agence.
        8. La sous-location du véhicule est strictement interdite.
        9. Le présent contrat est soumis au droit tunisien.
        """
        
        story.append(Paragraph(cgl_text.strip(), normal_style))
        story.append(Spacer(1, 1*cm))
        
        # Signatures
        story.append(Paragraph("<b>SIGNATURES</b>", heading_style))
        story.append(Spacer(1, 0.5*cm))
        
        signatures_data = [
            ["Le Locataire", "L'Agence"],
            ["", ""],
            ["", ""],
            [f"Date: {datetime.now().strftime('%d/%m/%Y')}", f"Date: {datetime.now().strftime('%d/%m/%Y')}"],
        ]
        
        signatures_table = Table(signatures_data, colWidths=[8*cm, 8*cm], rowHeights=[0.7*cm, 2*cm, 0.5*cm, 0.7*cm])
        signatures_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('LINEABOVE', (0, 2), (-1, 2), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ]))
        
        story.append(signatures_table)
        
        # Générer le PDF
        doc.build(story)
        
        # Sauvegarder si chemin fourni
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
        
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def save_contract_pdf(
        db: Session,
        contract_id: int,
        storage_dir: str = "storage/contracts"
    ) -> str:
        """
        Génère et sauvegarde le PDF d'un contrat
        
        Returns:
            Chemin du fichier sauvegardé
        """
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")
        
        # Créer le répertoire si nécessaire
        os.makedirs(storage_dir, exist_ok=True)
        
        # Nom de fichier
        filename = f"contract_{contract.contract_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(storage_dir, filename)
        
        # Générer le PDF
        PDFContractService.generate_contract_pdf(db, contract, filepath)
        
        # Mettre à jour le contrat
        contract.pdf_storage_path = filepath
        contract.pdf_generated_at = datetime.utcnow()
        db.commit()
        
        return filepath
