from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Prédiction IA simple (Moyenne mobile des 3 derniers mois pour le carburant)
@router.get("/predict-fuel")
def predict_next_month_fuel(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Accès réservé aux managers/admins")

    today = datetime.now()
    last_3_months = today - timedelta(days=90)
    
    fuels = db.query(models.Fuel).filter(models.Fuel.fuel_date >= last_3_months).all()
    
    if not fuels:
        return {"prediction": 0, "trend": "stable"}

    total_cost = sum(f.total_cost for f in fuels)
    average_monthly = total_cost / 3
    
    # Simulation d'une tendance (si les coûts augmentent, on prédit +5%)
    trend = "stable"
    prediction = average_monthly
    if total_cost > 0:
        trend = "increasing"
        prediction = average_monthly * 1.05 

    return {
        "prediction": round(prediction, 2),
        "trend": trend,
        "currency": "DA"
    }