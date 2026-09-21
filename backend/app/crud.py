from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from . import models, schemas


# ============ Vehicles ============
def get_vehicles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Vehicle).offset(skip).limit(limit).all()


def get_vehicle(db: Session, vehicle_id: int):
    return db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()


def get_vehicle_by_plate(db: Session, plate: str):
    return db.query(models.Vehicle).filter(models.Vehicle.license_plate == plate).first()


def create_vehicle(db: Session, vehicle: schemas.VehicleCreate):
    db_vehicle = models.Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def update_vehicle_mileage(db: Session, vehicle_id: int, mileage: int):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if vehicle:
        vehicle.current_mileage = mileage
        db.commit()
        db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if vehicle:
        db.delete(vehicle)
        db.commit()
    return vehicle


# ============ Maintenances ============
def get_maintenances(db: Session, vehicle_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Maintenance)
    if vehicle_id:
        query = query.filter(models.Maintenance.vehicle_id == vehicle_id)
    return query.order_by(models.Maintenance.maintenance_date.desc()).offset(skip).limit(limit).all()


def create_maintenance(db: Session, maintenance: schemas.MaintenanceCreate):
    db_maintenance = models.Maintenance(**maintenance.model_dump())
    db.add(db_maintenance)
    
    # Mettre à jour le kilométrage du véhicule
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == maintenance.vehicle_id).first()
    if vehicle and maintenance.mileage > vehicle.current_mileage:
        vehicle.current_mileage = maintenance.mileage
    
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance


def get_last_maintenance(db: Session, vehicle_id: int, maintenance_type: str):
    return (db.query(models.Maintenance)
            .filter(models.Maintenance.vehicle_id == vehicle_id,
                    models.Maintenance.maintenance_type == maintenance_type)
            .order_by(models.Maintenance.maintenance_date.desc())
            .first())


# ============ Fuels ============
def get_fuels(db: Session, vehicle_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Fuel)
    if vehicle_id:
        query = query.filter(models.Fuel.vehicle_id == vehicle_id)
    return query.order_by(models.Fuel.fuel_date.desc()).offset(skip).limit(limit).all()


def create_fuel(db: Session, fuel: schemas.FuelCreate):
    db_fuel = models.Fuel(**fuel.model_dump())
    db.add(db_fuel)
    
    # Mettre à jour le kilométrage du véhicule
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == fuel.vehicle_id).first()
    if vehicle and fuel.mileage > vehicle.current_mileage:
        vehicle.current_mileage = fuel.mileage
    
    db.commit()
    db.refresh(db_fuel)
    return db_fuel


def calculate_consumption(db: Session, vehicle_id: int):
    """Calcule la consommation moyenne L/100km"""
    fuels = (db.query(models.Fuel)
             .filter(models.Fuel.vehicle_id == vehicle_id, models.Fuel.full_tank == 1)
             .order_by(models.Fuel.fuel_date.asc())
             .all())
    
    if len(fuels) < 2:
        return None
    
    total_liters = 0
    total_km = 0
    
    for i in range(1, len(fuels)):
        total_liters += fuels[i].liters
        total_km += fuels[i].mileage - fuels[i-1].mileage
    
    if total_km == 0:
        return None
    
    return (total_liters / total_km) * 100


# ============ Expenses ============
def get_expenses(db: Session, vehicle_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Expense)
    if vehicle_id:
        query = query.filter(models.Expense.vehicle_id == vehicle_id)
    return query.order_by(models.Expense.expense_date.desc()).offset(skip).limit(limit).all()


def create_expense(db: Session, expense: schemas.ExpenseCreate):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def get_categories(db: Session):
    return db.query(models.ExpenseCategory).all()


def create_category(db: Session, name: str, description: Optional[str] = None):
    category = models.ExpenseCategory(name=name, description=description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# ============ Dashboard ============
def get_kpis(db: Session):
    vehicles = db.query(models.Vehicle).all()
    total_vehicles = len(vehicles)
    total_mileage = sum(v.current_mileage - v.initial_mileage for v in vehicles)
    
    total_fuel_cost = db.query(models.Fuel.total_cost).all()
    total_fuel_cost = sum(f[0] for f in total_fuel_cost)
    
    total_maintenance_cost = db.query(models.Maintenance.cost).all()
    total_maintenance_cost = sum(m[0] for m in total_maintenance_cost)
    
    total_expenses = db.query(models.Expense.amount).all()
    total_expenses = sum(e[0] for e in total_expenses)
    
    # Consommation moyenne globale
    all_fuels = db.query(models.Fuel).order_by(models.Fuel.vehicle_id, models.Fuel.fuel_date).all()
    total_liters = sum(f.liters for f in all_fuels)
    
    avg_consumption = 0
    if total_mileage > 0:
        avg_consumption = (total_liters / total_mileage) * 100
    
    total_cost = total_fuel_cost + total_maintenance_cost + total_expenses
    cost_per_km = total_cost / total_mileage if total_mileage > 0 else 0
    
    return schemas.KPIResponse(
        total_vehicles=total_vehicles,
        total_mileage=total_mileage,
        total_fuel_cost=total_fuel_cost,
        total_maintenance_cost=total_maintenance_cost,
        total_expenses=total_expenses,
        average_consumption=round(avg_consumption, 2),
        cost_per_km=round(cost_per_km, 2),
        active_alerts=0  # Sera calculé par le service alerts
    )


def get_vehicle_stats(db: Session, vehicle_id: int):
    vehicle = get_vehicle(db, vehicle_id)
    if not vehicle:
        return None
    
    mileage = vehicle.current_mileage - vehicle.initial_mileage
    
    fuel_cost = sum(f.total_cost for f in vehicle.fuels)
    maintenance_cost = sum(m.cost for m in vehicle.maintenances)
    expenses_cost = sum(e.amount for e in vehicle.expenses)
    
    total_cost = fuel_cost + maintenance_cost + expenses_cost
    cost_per_km = total_cost / mileage if mileage > 0 else 0
    
    avg_consumption = calculate_consumption(db, vehicle_id) or 0
    
    return schemas.VehicleStats(
        vehicle_id=vehicle.id,
        license_plate=vehicle.license_plate,
        total_cost=round(total_cost, 2),
        cost_per_km=round(cost_per_km, 2),
        total_fuel_cost=round(fuel_cost, 2),
        total_maintenance_cost=round(maintenance_cost, 2),
        total_expenses=round(expenses_cost, 2),
        total_mileage=mileage,
        average_consumption=round(avg_consumption, 2)
    )