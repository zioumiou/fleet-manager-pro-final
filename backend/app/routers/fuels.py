from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/fuels", tags=["fuels"])

@router.get("/", response_model=List[schemas.Fuel])
def get_fuels(vehicle_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Fuel)
    if vehicle_id:
        query = query.filter(models.Fuel.vehicle_id == vehicle_id)
    return query.all()

@router.get("/{fuel_id}", response_model=schemas.Fuel)
def get_fuel(fuel_id: int, db: Session = Depends(get_db)):
    fuel = db.query(models.Fuel).filter(models.Fuel.id == fuel_id).first()
    if not fuel:
        raise HTTPException(status_code=404, detail="Plein non trouvé")
    return fuel

@router.post("/", response_model=schemas.Fuel, status_code=201)
def create_fuel(fuel: schemas.FuelCreate, db: Session = Depends(get_db)):
    fuel_data = fuel.model_dump() if hasattr(fuel, 'model_dump') else fuel.dict()
    db_fuel = models.Fuel(**fuel_data)
    db.add(db_fuel)
    db.commit()
    db.refresh(db_fuel)
    return db_fuel

@router.put("/{fuel_id}", response_model=schemas.Fuel)
def update_fuel(fuel_id: int, fuel: schemas.FuelCreate, db: Session = Depends(get_db)):
    db_fuel = db.query(models.Fuel).filter(models.Fuel.id == fuel_id).first()
    if not db_fuel:
        raise HTTPException(status_code=404, detail="Plein non trouvé")
    
    fuel_data = fuel.model_dump() if hasattr(fuel, 'model_dump') else fuel.dict()
    for key, value in fuel_data.items():
        setattr(db_fuel, key, value)
        
    db.commit()
    db.refresh(db_fuel)
    return db_fuel

@router.delete("/{fuel_id}")
def delete_fuel(fuel_id: int, db: Session = Depends(get_db)):
    db_fuel = db.query(models.Fuel).filter(models.Fuel.id == fuel_id).first()
    if not db_fuel:
        raise HTTPException(status_code=404, detail="Plein non trouvé")
    db.delete(db_fuel)
    db.commit()
    return {"message": "Plein supprimé avec succès"}