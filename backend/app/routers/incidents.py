from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("/", response_model=List[schemas.Incident])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(models.Incident).all()

@router.post("/", response_model=schemas.Incident)
def create_incident(incident: schemas.IncidentBase, db: Session = Depends(get_db)):
    db_incident = models.Incident(**incident.dict())
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

@router.put("/{incident_id}", response_model=schemas.Incident)
def update_incident(incident_id: int, incident: schemas.IncidentBase, db: Session = Depends(get_db)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident non trouvé")
    for key, value in incident.dict(exclude_unset=True).items():
        setattr(db_incident, key, value)
    db.commit()
    db.refresh(db_incident)
    return db_incident

@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident non trouvé")
    db.delete(db_incident)
    db.commit()
    return {"message": "Incident supprimé"}