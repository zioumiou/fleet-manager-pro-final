from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.get("/", response_model=List[schemas.Budget])
def get_budgets(db: Session = Depends(get_db)):
    return db.query(models.Budget).all()

@router.post("/", response_model=schemas.Budget)
def create_budget(budget: schemas.BudgetBase, db: Session = Depends(get_db)):
    db_budget = models.Budget(**budget.dict())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.put("/{budget_id}", response_model=schemas.Budget)
def update_budget(budget_id: int, budget: schemas.BudgetBase, db: Session = Depends(get_db)):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id).first()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    for key, value in budget.dict(exclude_unset=True).items():
        setattr(db_budget, key, value)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id).first()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    db.delete(db_budget)
    db.commit()
    return {"message": "Budget supprimé"}