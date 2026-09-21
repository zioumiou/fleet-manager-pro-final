from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from datetime import date, timedelta
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("/", response_model=List[schemas.Vehicle])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).all()

@router.get("/{vehicle_id}", response_model=schemas.Vehicle)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    return vehicle

@router.get("/{vehicle_id}/tco")
def get_vehicle_tco(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    
    fuel_cost = db.query(models.Fuel.total_cost).filter(models.Fuel.vehicle_id == vehicle_id).all()
    maint_cost = db.query(models.Maintenance.cost).filter(models.Maintenance.vehicle_id == vehicle_id).all()
    exp_cost = db.query(models.Expense.amount).filter(models.Expense.vehicle_id == vehicle_id).all()
    tire_cost = db.query(models.Tire.cost).filter(models.Tire.vehicle_id == vehicle_id).all()
    
    from sqlalchemy import func
    fuel_cost = db.query(func.sum(models.Fuel.total_cost)).filter(models.Fuel.vehicle_id == vehicle_id).scalar() or 0.0
    maint_cost = db.query(func.sum(models.Maintenance.cost)).filter(models.Maintenance.vehicle_id == vehicle_id).scalar() or 0.0
    exp_cost = db.query(func.sum(models.Expense.amount)).filter(models.Expense.vehicle_id == vehicle_id).scalar() or 0.0
    tire_cost = db.query(func.sum(models.Tire.cost)).filter(models.Tire.vehicle_id == vehicle_id).scalar() or 0.0
    
    purchase_price = vehicle.purchase_price or 0.0
    resale_price = vehicle.resale_price or 0.0
    mileage = max(1, vehicle.current_mileage - vehicle.initial_mileage)
    
    tco = (purchase_price - resale_price) + fuel_cost + maint_cost + exp_cost + tire_cost
    cost_per_km = tco / mileage
    
    return {
        "license_plate": vehicle.license_plate,
        "purchase_price": purchase_price,
        "resale_price": resale_price,
        "fuel_cost": fuel_cost,
        "maintenance_cost": maint_cost,
        "expense_cost": exp_cost,
        "tire_cost": tire_cost,
        "total_tco": tco,
        "mileage": mileage,
        "cost_per_km": cost_per_km
    }

@router.post("/", response_model=schemas.Vehicle, status_code=201)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    vehicle_data = vehicle.model_dump() if hasattr(vehicle, 'model_dump') else vehicle.dict()
    db_vehicle = models.Vehicle(**vehicle_data)
    db.add(db_vehicle)
    try:
        db.commit()
        db.refresh(db_vehicle)
        
        # ✅ AUTO-CRÉATION DES RAPPELS PAR DÉFAUT
        today = date.today()
        
        # Rappel Assurance (dans 1 an)
        db.add(models.Reminder(
            vehicle_id=db_vehicle.id,
            category="Assurance",
            next_due_date=today + timedelta(days=365),
            notes="Renouvellement annuel de l'assurance"
        ))
        
        # Rappel Visite Technique (dans 4 ans pour véhicule neuf, 2 ans sinon)
        vt_delay = 365 * 4 if db_vehicle.year >= today.year - 1 else 365 * 2
        db.add(models.Reminder(
            vehicle_id=db_vehicle.id,
            category="Visite Technique",
            next_due_date=today + timedelta(days=vt_delay),
            notes="Contrôle technique périodique"
        ))
        
        # Rappel Vidange (dans 1 an ou 15 000 km)
        db.add(models.Reminder(
            vehicle_id=db_vehicle.id,
            category="Vidange",
            next_due_date=today + timedelta(days=365),
            next_due_mileage=db_vehicle.current_mileage + 15000,
            notes="Vidange huile moteur"
        ))
        
        db.commit()
        return db_vehicle
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Immatriculation déjà existante.")

@router.put("/{vehicle_id}", response_model=schemas.Vehicle)
def update_vehicle(vehicle_id: int, vehicle: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    
    vehicle_data = vehicle.model_dump(exclude_unset=True) if hasattr(vehicle, 'model_dump') else vehicle.dict(exclude_unset=True)
    for key, value in vehicle_data.items():
        setattr(db_vehicle, key, value)
        
    try:
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Immatriculation déjà existante.")

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    db.delete(db_vehicle)
    db.commit()
    return {"message": "Véhicule supprimé avec succès"}