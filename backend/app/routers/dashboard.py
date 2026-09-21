from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, timedelta
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/kpis")
def get_kpis(vehicle_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        # 1. Récupérer tous les véhicules ou le véhicule spécifique
        if vehicle_id:
            vehicles = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).all()
        else:
            vehicles = db.query(models.Vehicle).all()
        
        total_vehicles = len(vehicles)
        if total_vehicles == 0:
            return {
                "total_vehicles": 0, "total_mileage": 0, "total_fuel_cost": 0.0,
                "total_maintenance_cost": 0.0, "total_expenses": 0.0, "total_tire_cost": 0.0,
                "average_consumption": 0.0, "cost_per_km": 0.0, "active_alerts": 0,
                "avg_distance_between_fuels": 0.0, "daily_distance": 0.0, "daily_cost": 0.0,
                "monthly_cost": 0.0, "fuels_this_month": 0, "most_expensive_vehicle": None,
                "avg_holding_days": 0, "depreciation_per_day": 0.0, "total_fuel_count": 0,
                "maintenance_count": 0
            }

        # 2. Calculs de base
        # 2. Calculs de base - Kilométrage total (MAX entre véhicule et entrées)
        vehicle_mileages = [v.current_mileage or 0 for v in vehicles]

        # Récupérer le km max des entrées de carburant
        fuel_mileages = []
        for v in vehicles:
            max_fuel_km = db.query(func.max(models.Fuel.mileage)).filter(
                models.Fuel.vehicle_id == v.id
            ).scalar()
            if max_fuel_km:
                fuel_mileages.append(max_fuel_km)

        # Récupérer le km max des entretiens
        maintenance_mileages = []
        for v in vehicles:
            max_maint_km = db.query(func.max(models.Maintenance.mileage)).filter(
                models.Maintenance.vehicle_id == v.id
            ).scalar()
            if max_maint_km:
                maintenance_mileages.append(max_maint_km)

        # Le kilométrage total est le MAX de toutes ces valeurs
        all_mileages = vehicle_mileages + fuel_mileages + maintenance_mileages
        total_mileage = max(all_mileages) if all_mileages else 0
        
        # 3. Coûts totaux
        total_fuel_cost = 0.0
        total_maintenance_cost = 0.0
        total_expenses = 0.0
        total_tire_cost = 0.0
        total_liters = 0.0
        
        for v in vehicles:
            fuels = db.query(models.Fuel).filter(models.Fuel.vehicle_id == v.id).all()
            total_fuel_cost += sum(f.total_cost or 0 for f in fuels)
            total_liters += sum(f.liters or 0 for f in fuels)
            
            maintenances = db.query(models.Maintenance).filter(models.Maintenance.vehicle_id == v.id).all()
            total_maintenance_cost += sum(m.cost or 0 for m in maintenances)
            
            expenses_list = db.query(models.Expense).filter(models.Expense.vehicle_id == v.id).all()
            total_expenses += sum(e.amount or 0 for e in expenses_list)
            
            tires = db.query(models.Tire).filter(models.Tire.vehicle_id == v.id).all()
            total_tire_cost += sum(t.cost or 0 for t in tires)

        total_cost = total_fuel_cost + total_maintenance_cost + total_expenses + total_tire_cost
        
        # 4. Consommation et coût au km
        average_consumption = (total_liters / total_mileage * 100) if total_mileage > 0 else 0.0
        cost_per_km = (total_cost / total_mileage) if total_mileage > 0 else 0.0

        # 5. Calcul des jours de détention (moyenne ou total)
        today = date.today()
        total_holding_days = 0
        vehicles_with_purchase_date = 0
        
        for v in vehicles:
            if v.purchase_date:
                days = (today - v.purchase_date).days
                if days > 0:
                    total_holding_days += days
                    vehicles_with_purchase_date += 1
        
        avg_holding_days = total_holding_days // vehicles_with_purchase_date if vehicles_with_purchase_date > 0 else 1
        
        # 6. Dépenses/jour et /mois
        daily_cost = total_cost / avg_holding_days if avg_holding_days > 0 else 0.0
        monthly_cost = daily_cost * 30

        # 7. Distance quotidienne
        daily_distance = total_mileage / avg_holding_days if avg_holding_days > 0 else 0.0

        # 8. Pleins ce mois-ci
        first_day_this_month = today.replace(day=1)
        fuels_this_month = 0
        for v in vehicles:
            count = db.query(models.Fuel).filter(
                models.Fuel.vehicle_id == v.id,
                models.Fuel.fuel_date >= first_day_this_month
            ).count()
            fuels_this_month += count

        # 9. Distance entre pleins (moyenne globale)
        all_fuel_distances = []
        for v in vehicles:
            fuels = db.query(models.Fuel).filter(models.Fuel.vehicle_id == v.id).order_by(models.Fuel.fuel_date).all()
            for i in range(1, len(fuels)):
                dist = fuels[i].mileage - fuels[i-1].mileage
                if 0 < dist < 5000:
                    all_fuel_distances.append(dist)
        avg_distance_between_fuels = sum(all_fuel_distances) / len(all_fuel_distances) if all_fuel_distances else 0.0

        # 10. Véhicule le plus coûteux
        most_expensive_vehicle = None
        max_cost_per_km = 0
        
        for v in vehicles:
            v_fuel = db.query(func.sum(models.Fuel.total_cost)).filter(models.Fuel.vehicle_id == v.id).scalar() or 0
            v_maint = db.query(func.sum(models.Maintenance.cost)).filter(models.Maintenance.vehicle_id == v.id).scalar() or 0
            v_exp = db.query(func.sum(models.Expense.amount)).filter(models.Expense.vehicle_id == v.id).scalar() or 0
            v_tire = db.query(func.sum(models.Tire.cost)).filter(models.Tire.vehicle_id == v.id).scalar() or 0
            v_total = v_fuel + v_maint + v_exp + v_tire
            
            v_km = max(1, (v.current_mileage or 0) - (v.initial_mileage or 0))
            v_cpk = v_total / v_km
            
            if v_cpk > max_cost_per_km:
                max_cost_per_km = v_cpk
                most_expensive_vehicle = f"{v.license_plate} ({v.brand} {v.model})"

        # 11. Dépréciation
        total_depreciation = 0.0
        for v in vehicles:
            if v.purchase_price and v.resale_price and v.purchase_date:
                days = (today - v.purchase_date).days
                if days > 0:
                    total_depreciation += (v.purchase_price - v.resale_price) / days
        depreciation_per_day = total_depreciation / total_vehicles if total_vehicles > 0 else 0.0

        # 12. Compteurs
        total_fuel_count = db.query(func.count(models.Fuel.id)).filter(
            models.Fuel.vehicle_id.in_([v.id for v in vehicles])
        ).scalar() or 0
        
        maintenance_count = db.query(func.count(models.Maintenance.id)).filter(
            models.Maintenance.vehicle_id.in_([v.id for v in vehicles])
        ).scalar() or 0

        # 13. Alertes
        active_alerts = sum(1 for v in vehicles if (v.current_mileage or 0) > 100000)

        return {
            "total_vehicles": total_vehicles,
            "total_mileage": int(total_mileage),
            "total_fuel_cost": total_fuel_cost,
            "total_maintenance_cost": total_maintenance_cost,
            "total_expenses": total_expenses,
            "total_tire_cost": total_tire_cost,
            "average_consumption": average_consumption,
            "cost_per_km": cost_per_km,
            "active_alerts": active_alerts,
            "avg_distance_between_fuels": avg_distance_between_fuels,
            "daily_distance": daily_distance,
            "daily_cost": daily_cost,
            "monthly_cost": monthly_cost,
            "fuels_this_month": fuels_this_month,
            "most_expensive_vehicle": most_expensive_vehicle,
            "avg_holding_days": avg_holding_days,
            "depreciation_per_day": depreciation_per_day,
            "total_fuel_count": total_fuel_count,
            "maintenance_count": maintenance_count
        }
        
    except Exception as e:
        print(f"ERREUR DASHBOARD: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    try:
        alerts = []
        vehicles = db.query(models.Vehicle).all()
        for v in vehicles:
            if v.current_mileage and v.current_mileage > 100000:
                alerts.append({
                    "vehicle_id": v.id,
                    "license_plate": v.license_plate,
                    "item_name": "Révision majeure",
                    "alert_type": "km",
                    "current_value": v.current_mileage,
                    "threshold_value": 120000,
                    "km_remaining": max(0, 120000 - v.current_mileage),
                    "severity": "critical"
                })
        return alerts
    except Exception as e:
        return []