from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from ..database import get_db
from .. import models

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
def get_notifications(db: Session = Depends(get_db)):
    today = date.today()
    next_week = today + timedelta(days=7)
    
    notifications = []
    
    # 1. Rappels en retard (Urgence)
    overdue_reminders = db.query(models.Reminder).filter(
        models.Reminder.next_due_date < today
    ).all()
    for r in overdue_reminders:
        notifications.append({
            "id": r.id,
            "type": "urgence",
            "message": f"⚠️ RETARD : {r.category} (prévu le {r.next_due_date.strftime('%d/%m/%Y')})",
            "date": r.next_due_date.isoformat(),
            "read": False
        })

    # 2. Rappels à venir dans les 7 jours (Info)
    upcoming_reminders = db.query(models.Reminder).filter(
        models.Reminder.next_due_date >= today,
        models.Reminder.next_due_date <= next_week
    ).all()
    for r in upcoming_reminders:
        notifications.append({
            "id": r.id,
            "type": "info",
            "message": f"📅 À prévoir : {r.category} le {r.next_due_date.strftime('%d/%m/%Y')}",
            "date": r.next_due_date.isoformat(),
            "read": False
        })

    # Trier par date (les plus urgents en premier)
    notifications.sort(key=lambda x: x["date"])
    return notifications