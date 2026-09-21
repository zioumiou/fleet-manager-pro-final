from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/maintenances", tags=["maintenances"])

@router.get("/", response_model=List[schemas.Maintenance])
def get_maintenances(vehicle_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Maintenance)
    if vehicle_id:
        query = query.filter(models.Maintenance.vehicle_id == vehicle_id)
    return query.all()

@router.get("/{maintenance_id}", response_model=schemas.Maintenance)
def get_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Entretien non trouvé")
    return maintenance

@router.post("/", response_model=schemas.Maintenance, status_code=201)
def create_maintenance(maintenance: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    maintenance_data = maintenance.model_dump() if hasattr(maintenance, 'model_dump') else maintenance.dict()
    db_maintenance = models.Maintenance(**maintenance_data)
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance

@router.put("/{maintenance_id}", response_model=schemas.Maintenance)
def update_maintenance(maintenance_id: int, maintenance: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    db_maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not db_maintenance:
        raise HTTPException(status_code=404, detail="Entretien non trouvé")
    
    maintenance_data = maintenance.model_dump() if hasattr(maintenance, 'model_dump') else maintenance.dict()
    for key, value in maintenance_data.items():
        setattr(db_maintenance, key, value)
        
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance

@router.delete("/{maintenance_id}")
def delete_maintenance(maintenance_id: int, db: Session = Depends(get_db)):
    db_maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not db_maintenance:
        raise HTTPException(status_code=404, detail="Entretien non trouvé")
    db.delete(db_maintenance)
    db.commit()
    return {"message": "Entretien supprimé avec succès"}