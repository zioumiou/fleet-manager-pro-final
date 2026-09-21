from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.get("/", response_model=List[schemas.Driver])
def get_drivers(db: Session = Depends(get_db)):
    return db.query(models.Driver).all()

@router.post("/", response_model=schemas.Driver)
def create_driver(driver: schemas.DriverBase, db: Session = Depends(get_db)):
    db_driver = models.Driver(**driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.put("/{driver_id}", response_model=schemas.Driver)
def update_driver(driver_id: int, driver: schemas.DriverBase, db: Session = Depends(get_db)):
    db_driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Conducteur non trouvé")
    
    # Mise à jour des champs
    update_data = driver.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_driver, key, value)
        
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.delete("/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    db_driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Conducteur non trouvé")
    
    db.delete(db_driver)
    db.commit()
    return {"message": "Conducteur supprimé avec succès"}