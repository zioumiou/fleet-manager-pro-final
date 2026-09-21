from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/naftal", tags=["naftal"])

@router.get("/cards/", response_model=List[schemas.NaftalCard])
def get_cards(db: Session = Depends(get_db)):
    return db.query(models.NaftalCard).all()

@router.post("/cards/", response_model=schemas.NaftalCard)
def create_card(card: schemas.NaftalCardBase, db: Session = Depends(get_db)):
    db_card = models.NaftalCard(**card.dict())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@router.put("/cards/{card_id}", response_model=schemas.NaftalCard)
def update_card(card_id: int, card: schemas.NaftalCardBase, db: Session = Depends(get_db)):
    db_card = db.query(models.NaftalCard).filter(models.NaftalCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Carte non trouvée")
    for key, value in card.dict().items():
        setattr(db_card, key, value)
    db.commit()
    db.refresh(db_card)
    return db_card

@router.delete("/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(models.NaftalCard).filter(models.NaftalCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Carte non trouvée")
    db.delete(db_card)
    db.commit()
    return {"message": "Carte supprimée"}

@router.get("/cards/{card_id}/transactions", response_model=List[schemas.NaftalTransaction])
def get_transactions(card_id: int, db: Session = Depends(get_db)):
    return db.query(models.NaftalTransaction).filter(
        models.NaftalTransaction.card_id == card_id
    ).order_by(models.NaftalTransaction.transaction_date.desc()).all()

@router.post("/transactions/", response_model=schemas.NaftalTransaction)
def create_transaction(transaction: schemas.NaftalTransactionBase, db: Session = Depends(get_db)):
    card = db.query(models.NaftalCard).filter(models.NaftalCard.id == transaction.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Carte non trouvée")
    if card.current_balance < transaction.amount:
        raise HTTPException(status_code=400, detail="Solde insuffisant")
    
    card.current_balance -= transaction.amount
    
    db_transaction = models.NaftalTransaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction