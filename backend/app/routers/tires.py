from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/tires", tags=["tires"])

@router.get("/", response_model=List[schemas.Tire])
def get_tires(vehicle_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Tire)
    if vehicle_id:
        query = query.filter(models.Tire.vehicle_id == vehicle_id)
    return query.order_by(models.Tire.change_date.desc()).all()

@router.post("/", response_model=schemas.Tire, status_code=201)
def create_tire(tire: schemas.TireCreate, db: Session = Depends(get_db)):
    db_tire = models.Tire(**tire.model_dump() if hasattr(tire, 'model_dump') else tire.dict())
    db.add(db_tire)
    db.commit()
    db.refresh(db_tire)
    return db_tire

@router.delete("/{tire_id}")
def delete_tire(tire_id: int, db: Session = Depends(get_db)):
    db_tire = db.query(models.Tire).filter(models.Tire.id == tire_id).first()
    if not db_tire:
        raise HTTPException(status_code=404, detail="Entrée pneu non trouvée")
    db.delete(db_tire)
    db.commit()
    return {"message": "Entrée supprimée avec succès"}