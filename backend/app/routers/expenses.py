from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/", response_model=List[schemas.Expense])
def get_expenses(vehicle_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Expense)
    if vehicle_id:
        query = query.filter(models.Expense.vehicle_id == vehicle_id)
    return query.all()

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    # Catégories par défaut (peuvent être étendues plus tard)
    return [
        {"id": 1, "name": "Péage"},
        {"id": 2, "name": "Parking"},
        {"id": 3, "name": "Amende"},
        {"id": 4, "name": "Assurance"},
        {"id": 5, "name": "Vignette"},
        {"id": 6, "name": "Consommable"},
        {"id": 7, "name": "Autre"}
    ]

@router.get("/{expense_id}", response_model=schemas.Expense)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Dépense non trouvée")
    return expense

@router.post("/", response_model=schemas.Expense, status_code=201)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense_data = expense.model_dump() if hasattr(expense, 'model_dump') else expense.dict()
    db_expense = models.Expense(**expense_data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Dépense non trouvée")
    
    expense_data = expense.model_dump() if hasattr(expense, 'model_dump') else expense.dict()
    for key, value in expense_data.items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Dépense non trouvée")
    db.delete(db_expense)
    db.commit()
    return {"message": "Dépense supprimée avec succès"}