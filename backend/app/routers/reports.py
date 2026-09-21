from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import cm
import qrcode
import os
from datetime import datetime
from ..database import get_db
from .. import models

router = APIRouter(prefix="/reports", tags=["reports"])

# Dossier pour stocker les QR codes générés
QR_DIR = "qr_codes"
os.makedirs(QR_DIR, exist_ok=True)

def generate_qr_code(vehicle_id: int, base_url: str = "http://localhost:5173") -> str:
    """Génère un QR code pour un véhicule"""
    qr_data = f"{base_url}/vehicles/{vehicle_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    file_path = f"{QR_DIR}/vehicle_{vehicle_id}.png"
    img.save(file_path)
    return file_path

def fmt_money(amount):
    """Formatte un montant en DA"""
    if amount is None:
        return "0.00 DA"
    return f"{amount:,.2f} DA".replace(",", " ")

# ============ RAPPORT FICHE VÉHICULE ============
@router.get("/vehicle/{vehicle_id}/pdf")
def generate_vehicle_pdf(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    
    # Récupérer les données associées
    fuels = db.query(models.Fuel).filter(models.Fuel.vehicle_id == vehicle_id).order_by(models.Fuel.fuel_date.desc()).all()
    maintenances = db.query(models.Maintenance).filter(models.Maintenance.vehicle_id == vehicle_id).order_by(models.Maintenance.maintenance_date.desc()).all()
    incidents = db.query(models.Incident).filter(models.Incident.vehicle_id == vehicle_id).all() if hasattr(models, 'Incident') else []
    
    # Générer le QR code
    qr_path = generate_qr_code(vehicle_id)
    
    # Créer le PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1e40af'), spaceAfter=12)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#374151'), spaceBefore=12, spaceAfter=6)
    
    elements = []
    
    # En-tête
    elements.append(Paragraph("FLEET MANAGER PRO", styles['Title']))
    elements.append(Paragraph("Fiche Véhicule", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # QR Code à droite
    try:
        qr_img = Image(qr_path, width=3*cm, height=3*cm)
        elements.append(qr_img)
        elements.append(Spacer(1, 0.5*cm))
    except:
        pass
    
    # Informations générales
    elements.append(Paragraph("Informations Générales", section_style))
    info_data = [
        ["Plaque d'immatriculation", vehicle.license_plate or "-"],
        ["Marque / Modèle", f"{vehicle.brand or '-'} {vehicle.model or ''}"],
        ["Année", str(vehicle.year or "-")],
        ["Type de carburant", vehicle.fuel_type or "-"],
        ["Kilométrage actuel", f"{vehicle.current_mileage or 0:,} km".replace(",", " ")],
        ["Statut", vehicle.status or "-"],
        ["Date d'achat", vehicle.purchase_date.strftime('%d/%m/%Y') if vehicle.purchase_date else "-"],
        ["Prix d'achat", fmt_money(vehicle.purchase_price)],
    ]
    info_table = Table(info_data, colWidths=[8*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    
    # Historique Carburant
    if fuels:
        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph("Historique Carburant", section_style))
        fuel_data = [["Date", "Litres", "Prix/L", "Total", "Station"]]
        for f in fuels[:20]:  # Limiter à 20 derniers
            fuel_data.append([
                f.fuel_date.strftime('%d/%m/%Y') if f.fuel_date else "-",
                f"{f.liters or 0:.2f} L",
                fmt_money(f.price_per_liter),
                fmt_money(f.total_cost),
                f.station or "-"
            ])
        fuel_table = Table(fuel_data, colWidths=[3*cm, 2*cm, 2.5*cm, 2.5*cm, 3*cm])
        fuel_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(fuel_table)
    
    # Historique Entretiens
    if maintenances:
        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph("Historique Entretiens", section_style))
        maint_data = [["Date", "Type", "Description", "Coût"]]
        for m in maintenances[:20]:
            maint_data.append([
                m.maintenance_date.strftime('%d/%m/%Y') if m.maintenance_date else "-",
                m.maintenance_type or "-",
                (m.description or "-")[:40],
                fmt_money(m.cost)
            ])
        maint_table = Table(maint_data, colWidths=[3*cm, 3*cm, 5*cm, 3*cm])
        maint_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(maint_table)
    
    # Pied de page
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f"<i>Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} - FleetManager Pro</i>",
        styles['Normal']
    ))
    
    doc.build(elements)
    buffer.seek(0)
    
    # Sauvegarder temporairement
    file_path = f"reports/vehicle_{vehicle_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    os.makedirs("reports", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(buffer.read())
    
    return FileResponse(file_path, media_type='application/pdf', filename=f"fiche_{vehicle.license_plate}.pdf")

# ============ RAPPORT FINANCIER GLOBAL ============
@router.get("/financial/pdf")
def generate_financial_pdf(db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).all()
    fuels = db.query(models.Fuel).all()
    maintenances = db.query(models.Maintenance).all()
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1e40af'))
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#374151'), spaceBefore=12)
    
    elements = []
    elements.append(Paragraph("FLEET MANAGER PRO", styles['Title']))
    elements.append(Paragraph("Rapport Financier Global", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Totaux
    total_fuel = sum(f.total_cost or 0 for f in fuels)
    total_maint = sum(m.cost or 0 for m in maintenances)
    total_vehicles = len(vehicles)
    
    elements.append(Paragraph("Synthèse", section_style))
    summary_data = [
        ["Nombre de véhicules", str(total_vehicles)],
        ["Total Carburant", fmt_money(total_fuel)],
        ["Total Entretiens", fmt_money(total_maint)],
        ["TOTAL GÉNÉRAL", fmt_money(total_fuel + total_maint)],
    ]
    summary_table = Table(summary_data, colWidths=[8*cm, 6*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#dbeafe')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    
    # Détail par véhicule
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph("Détail par véhicule", section_style))
    vehicle_data = [["Plaque", "Marque/Modèle", "Carburant", "Entretien", "Total"]]
    for v in vehicles:
        v_fuel = sum(f.total_cost or 0 for f in fuels if f.vehicle_id == v.id)
        v_maint = sum(m.cost or 0 for m in maintenances if m.vehicle_id == v.id)
        vehicle_data.append([
            v.license_plate or "-",
            f"{v.brand or ''} {v.model or ''}",
            fmt_money(v_fuel),
            fmt_money(v_maint),
            fmt_money(v_fuel + v_maint)
        ])
    vehicle_table = Table(vehicle_data, colWidths=[3*cm, 4*cm, 3*cm, 3*cm, 3*cm])
    vehicle_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(vehicle_table)
    
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f"<i>Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} - FleetManager Pro</i>",
        styles['Normal']
    ))
    
    doc.build(elements)
    buffer.seek(0)
    
    file_path = f"reports/financial_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    os.makedirs("reports", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(buffer.read())
    
    return FileResponse(file_path, media_type='application/pdf', filename=f"rapport_financier_{datetime.now().strftime('%Y%m%d')}.pdf")

# ============ RAPPORT INCIDENT ============
@router.get("/incident/{incident_id}/pdf")
def generate_incident_pdf(incident_id: int, db: Session = Depends(get_db)):
    if not hasattr(models, 'Incident'):
        raise HTTPException(status_code=404, detail="Module incidents non disponible")
    
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouvé")
    
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == incident.vehicle_id).first()
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#dc2626'))
    
    elements = []
    elements.append(Paragraph("FLEET MANAGER PRO", styles['Title']))
    elements.append(Paragraph("Rapport d'Incident", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    info_data = [
        ["Date de l'incident", incident.incident_date.strftime('%d/%m/%Y') if incident.incident_date else "-"],
        ["Type", incident.incident_type or "-"],
        ["Véhicule impliqué", f"{vehicle.license_plate if vehicle else '-'} - {vehicle.brand if vehicle else ''} {vehicle.model if vehicle else ''}"],
        ["Statut", incident.status or "-"],
        ["Coût estimé", fmt_money(incident.cost)],
        ["Description", incident.description or "-"],
        ["Notes", incident.notes or "-"],
    ]
    info_table = Table(info_data, colWidths=[5*cm, 11*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fee2e2')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f"<i>Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} - FleetManager Pro</i>",
        styles['Normal']
    ))
    
    doc.build(elements)
    buffer.seek(0)
    
    file_path = f"reports/incident_{incident_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    os.makedirs("reports", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(buffer.read())
    
    return FileResponse(file_path, media_type='application/pdf', filename=f"incident_{incident_id}.pdf")