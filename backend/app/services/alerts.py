from sqlalchemy.orm import Session
from datetime import date
from typing import List
from .. import models, schemas


# Définition des intervalles d'entretien (basés sur le carnet Coolray)
MAINTENANCE_INTERVALS = {
    "Huile moteur BHE15": {"km": 10000, "months": 12, "first_km": 5000, "first_months": 3, "critical": True},
    "Huile moteur 4G14T": {"km": 7500, "months": 6, "first_km": 5000, "first_months": 3, "critical": True},
    "Filtre à huile BHE15": {"km": 10000, "months": 12, "first_km": 5000, "first_months": 3, "critical": True},
    "Filtre à huile 4G14T": {"km": 7500, "months": 6, "first_km": 5000, "first_months": 3, "critical": True},
    "Filtre à air": {"km": 10000, "months": 12, "critical": False},
    "Filtre à carburant": {"km": 30000, "critical": False},
    "Liquide de refroidissement": {"km": 40000, "months": 24, "critical": True},
    "Courroie d'accessoire": {"km": 100000, "critical": True},
    "Bougies BHE15": {"km": 40000, "critical": False},
    "Bougies 4G14T": {"km": 20000, "critical": False},
    "Canister": {"km": 120000, "months": 120, "critical": False},
    "Liquide de frein": {"km": 40000, "months": 24, "critical": True},
    "Huile boîte manuelle": {"km": 40000, "months": 24, "critical": True},
    "Huile boîte DCT": {"km": 80000, "months": 48, "critical": True},
    "Filtre habitacle": {"km": 8000, "months": 9, "critical": False},
}


def get_alerts_for_vehicle(db: Session, vehicle_id: int) -> List[schemas.AlertResponse]:
    """Génère toutes les alertes pour un véhicule donné"""
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        return []
    
    alerts = []
    current_km = vehicle.current_mileage
    today = date.today()
    
    # Déterminer les items à vérifier selon le type de moteur
    items_to_check = []
    
    for item_name, interval in MAINTENANCE_INTERVALS.items():
        # Filtrer selon le type de moteur
        if "BHE15" in item_name and vehicle.engine_type != models.EngineType.BHE15:
            continue
        if "4G14T" in item_name and vehicle.engine_type != models.EngineType.G14T:
            continue
        if "boîte manuelle" in item_name and vehicle.transmission != models.TransmissionType.MANUAL:
            continue
        if "boîte DCT" in item_name and vehicle.transmission != models.TransmissionType.DCT:
            continue
        
        items_to_check.append((item_name, interval))
    
    for item_name, interval in items_to_check:
        # Trouver le dernier entretien pour cet item
        last_maintenance = (db.query(models.Maintenance)
                           .filter(models.Maintenance.vehicle_id == vehicle_id,
                                   models.Maintenance.maintenance_type == item_name)
                           .order_by(models.Maintenance.maintenance_date.desc())
                           .first())
        
        # Déterminer les seuils
        if last_maintenance:
            threshold_km = last_maintenance.mileage + interval["km"]
            threshold_date = last_maintenance.maintenance_date
            if "months" in interval:
                from dateutil.relativedelta import relativedelta
                threshold_date = last_maintenance.maintenance_date + relativedelta(months=interval["months"])
        else:
            # Premier entretien
            threshold_km = vehicle.initial_mileage + interval.get("first_km", interval["km"])
            threshold_date = vehicle.purchase_date
            if threshold_date and "first_months" in interval:
                from dateutil.relativedelta import relativedelta
                threshold_date = vehicle.purchase_date + relativedelta(months=interval["first_months"])
        
        # Vérifier alerte km
        if "km" in interval:
            km_remaining = threshold_km - current_km
            if km_remaining <= 1000:  # Alerte si moins de 1000 km restants
                severity = "critical" if km_remaining <= 0 else "warning"
                alerts.append(schemas.AlertResponse(
                    vehicle_id=vehicle.id,
                    license_plate=vehicle.license_plate,
                    item_name=item_name,
                    alert_type="km",
                    current_value=current_km,
                    threshold_value=threshold_km,
                    km_remaining=km_remaining,
                    severity=severity
                ))
        
        # Vérifier alerte date
        if "months" in interval and threshold_date:
            days_remaining = (threshold_date - today).days
            if days_remaining <= 30:  # Alerte si moins de 30 jours
                severity = "critical" if days_remaining <= 0 else "warning"
                alerts.append(schemas.AlertResponse(
                    vehicle_id=vehicle.id,
                    license_plate=vehicle.license_plate,
                    item_name=item_name,
                    alert_type="date",
                    current_value=today.toordinal(),
                    threshold_value=threshold_date.toordinal(),
                    days_remaining=days_remaining,
                    severity=severity
                ))
    
    return alerts


def get_all_alerts(db: Session) -> List[schemas.AlertResponse]:
    """Récupère toutes les alertes pour tous les véhicules"""
    vehicles = db.query(models.Vehicle).all()
    all_alerts = []
    
    for vehicle in vehicles:
        alerts = get_alerts_for_vehicle(db, vehicle.id)
        all_alerts.extend(alerts)
    
    # Trier par sévérité puis par days_remaining/km_remaining
    all_alerts.sort(key=lambda x: (0 if x.severity == "critical" else 1, x.days_remaining or 9999))
    
    return all_alerts