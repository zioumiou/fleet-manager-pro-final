from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/reminders", tags=["reminders"])

def calculate_status(next_due_date, next_due_mileage, current_mileage):
    today = datetime.now().date()
    days_remaining = (next_due_date - today).days if next_due_date else None
    km_remaining = (next_due_mileage - current_mileage) if next_due_mileage else None
    
    status = "green"
    # Si l'un des deux seuils est dépassé, c'est rouge
    if (days_remaining is not None and days_remaining <= 0) or (km_remaining is not None and km_remaining <= 0):
        status = "red"
    # Si l'un des deux seuils est proche, c'est orange
    elif (days_remaining is not None and days_remaining <= 30) or (km_remaining is not None and km_remaining <= 2000):
        status = "orange"
        
    return days_remaining, km_remaining, status

@router.get("/", response_model=List[schemas.Reminder])
def get_reminders(db: Session = Depends(get_db)):
    reminders = db.query(models.Reminder).all()
    result = []
    for r in reminders:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == r.vehicle_id).first()
        current_mileage = vehicle.current_mileage if vehicle else 0
        days_rem, km_rem, status = calculate_status(r.next_due_date, r.next_due_mileage, current_mileage)
        
        result.append({
            "id": r.id, "vehicle_id": r.vehicle_id, "category": r.category,
            "next_due_date": r.next_due_date, "next_due_mileage": r.next_due_mileage, "notes": r.notes,
            "days_remaining": days_rem, "km_remaining": km_rem, "status": status,
            "vehicle_plate": vehicle.license_plate if vehicle else "Inconnu"
        })
    return result

@router.post("/", response_model=schemas.Reminder)
def create_reminder(reminder: schemas.ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = models.Reminder(**(reminder.model_dump() if hasattr(reminder, 'model_dump') else reminder.dict()))
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == db_reminder.vehicle_id).first()
    current_mileage = vehicle.current_mileage if vehicle else 0
    days_rem, km_rem, status = calculate_status(db_reminder.next_due_date, db_reminder.next_due_mileage, current_mileage)
    
    return {**db_reminder.__dict__, "days_remaining": days_rem, "km_remaining": km_rem, "status": status, "vehicle_plate": vehicle.license_plate if vehicle else "Inconnu"}

@router.put("/{reminder_id}", response_model=schemas.Reminder)
def update_reminder(reminder_id: int, reminder: schemas.ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Rappel non trouvé")
    
    reminder_data = reminder.model_dump(exclude_unset=True) if hasattr(reminder, 'model_dump') else reminder.dict(exclude_unset=True)
    for key, value in reminder_data.items():
        setattr(db_reminder, key, value)
        
    db.commit()
    db.refresh(db_reminder)
    
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == db_reminder.vehicle_id).first()
    current_mileage = vehicle.current_mileage if vehicle else 0
    days_rem, km_rem, status = calculate_status(db_reminder.next_due_date, db_reminder.next_due_mileage, current_mileage)
    
    return {**db_reminder.__dict__, "days_remaining": days_rem, "km_remaining": km_rem, "status": status, "vehicle_plate": vehicle.license_plate if vehicle else "Inconnu"}

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Rappel non trouvé")
    db.delete(db_reminder)
    db.commit()
    return {"message": "Rappel supprimé"}