import io
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
from typing import List, Dict, Any

def create_fleet_report_pdf(kpis: Dict[str, Any], vehicles: List[Dict], 
                           maintenances: List[Dict], fuels: List[Dict]) -> io.BytesIO:
    """Crée un rapport PDF complet de la flotte"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Titre
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1E40AF'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    elements.append(Paragraph(" FleetManager Pro - Rapport Mensuel", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Date
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.gray,
        alignment=TA_CENTER
    )
    elements.append(Paragraph(f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}", date_style))
    elements.append(Spacer(1, 1*cm))
    
    # KPIs
    kpi_data = [
        ['📊 INDICATEURS CLÉS', '', '', ''],
        ['Véhicules actifs', str(kpis.get('total_vehicles', 0)), 
         'Kilométrage total', f"{kpis.get('total_mileage', 0):,} km"],
        ['Coût carburant', f"{kpis.get('total_fuel_cost', 0):,.2f} €",
         'Coût entretien', f"{kpis.get('total_maintenance_cost', 0):,.2f} €"],
        ['Consommation moy.', f"{kpis.get('average_consumption', 0):.1f} L/100km",
         'Coût au km', f"{kpis.get('cost_per_km', 0):.2f} €/km"],
    ]
    
    kpi_table = Table(kpi_data, colWidths=[4*cm, 4*cm, 4*cm, 4*cm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    elements.append(kpi_table)
    elements.append(Spacer(1, 1.5*cm))
    
    # Liste des véhicules
    elements.append(Paragraph(" LISTE DES VÉHICULES", styles['Heading2']))
    elements.append(Spacer(1, 0.5*cm))
    
    if vehicles:
        vehicle_data = [['Immatriculation', 'Marque/Modèle', 'Année', 'Kilométrage', 'Moteur']]
        for v in vehicles:
            vehicle_data.append([
                v.get('license_plate', ''),
                f"{v.get('brand', '')} {v.get('model', '')}",
                str(v.get('year', '')),
                f"{v.get('current_mileage', 0):,} km",
                v.get('engine_type', '')
            ])
        
        vehicle_table = Table(vehicle_data, colWidths=[3*cm, 4*cm, 2*cm, 3*cm, 3*cm])
        vehicle_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(vehicle_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer