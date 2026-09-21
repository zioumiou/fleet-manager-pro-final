from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import io
import csv

from ..database import get_db
from .. import models, crud
from ..services.excel_service import create_excel_buffer
from ..services.pdf_service import create_fleet_report_pdf

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/vehicles/csv")
def export_vehicles_csv(db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).all()
    output = io.StringIO()
    output.write('\ufeff') # BOM pour Excel
    
    writer = csv.writer(output)
    writer.writerow(["ID", "Immatriculation", "Marque", "Modèle", "Année", "Conducteur", "Prix Achat", "Km Actuels"])
    for v in vehicles:
        writer.writerow([v.id, v.license_plate, v.brand, v.model, v.year, v.driver_name or "N/A", v.purchase_price or 0, v.current_mileage])
    
    output.seek(0)
    return StreamingResponse(io.BytesIO(output.getvalue().encode('utf-8')), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=vehicules.csv"})

@router.get("/vehicles/excel")
def export_vehicles_excel(db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).all()
    data = [{"ID": v.id, "Immatriculation": v.license_plate, "Marque": v.brand, "Modèle": v.model, "Année": v.year, "Conducteur": v.driver_name or "N/A", "Prix Achat": v.purchase_price or 0, "Km Actuels": v.current_mileage} for v in vehicles]
    return StreamingResponse(create_excel_buffer(data, "Véhicules"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=vehicules.xlsx"})

@router.get("/maintenances/excel")
def export_maintenances_excel(db: Session = Depends(get_db)):
    maintenances = db.query(models.Maintenance).all()
    data = [{"ID": m.id, "Véhicule": (db.query(models.Vehicle).filter(models.Vehicle.id == m.vehicle_id).first().license_plate if db.query(models.Vehicle).filter(models.Vehicle.id == m.vehicle_id).first() else "N/A"), "Date": m.maintenance_date, "Type": m.maintenance_type, "Coût": m.cost} for m in maintenances]
    return StreamingResponse(create_excel_buffer(data, "Entretiens"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=entretiens.xlsx"})

@router.get("/expenses/excel")
def export_expenses_excel(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).all()
    data = [{"ID": e.id, "Véhicule": (db.query(models.Vehicle).filter(models.Vehicle.id == e.vehicle_id).first().license_plate if db.query(models.Vehicle).filter(models.Vehicle.id == e.vehicle_id).first() else "N/A"), "Date": e.expense_date, "Description": e.description, "Montant": e.amount} for e in expenses]
    return StreamingResponse(create_excel_buffer(data, "Dépenses"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=depenses.xlsx"})

@router.get("/report/global/pdf")
def export_global_report_pdf(db: Session = Depends(get_db)):
    kpis = crud.get_kpis(db)
    vehicles = db.query(models.Vehicle).all()
    
    vehicles_dict = [{"id": v.id, "license_plate": v.license_plate, "brand": v.brand, "model": v.model, "year": v.year, "engine_type": v.engine_type, "current_mileage": v.current_mileage} for v in vehicles]
    
    # CORRECTION CRITIQUE : Convertir l'objet Pydantic en dictionnaire pour le service PDF
    kpis_dict = kpis.model_dump() if hasattr(kpis, 'model_dump') else (kpis.dict() if hasattr(kpis, 'dict') else kpis)
    
    buffer = create_fleet_report_pdf(kpis=kpis_dict, vehicles=vehicles_dict, maintenances=[], fuels=[])
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=rapport_fleet_{datetime.now().strftime('%Y%m')}.pdf"})

@router.get("/vehicle/{vehicle_id}/pdf")
def export_vehicle_report_pdf(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
        
    kpis_dict = {"total_vehicles": 1, "total_mileage": vehicle.current_mileage, "total_fuel_cost": 0, "total_maintenance_cost": 0, "average_consumption": 0, "cost_per_km": 0}
    
    buffer = create_fleet_report_pdf(
        kpis=kpis_dict,
        vehicles=[{"id": vehicle.id, "license_plate": vehicle.license_plate, "brand": vehicle.brand, "model": vehicle.model, "year": vehicle.year, "engine_type": vehicle.engine_type, "current_mileage": vehicle.current_mileage}],
        maintenances=[], fuels=[]
    )
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=fiche_{vehicle.license_plate}.pdf"})