from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from datetime import date
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

# Dossier pour stocker les fichiers uploadés
UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.Document)
async def upload_document(
    vehicle_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Vérifier que le véhicule existe
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")

    # Générer un nom de fichier unique pour éviter les conflits
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Sauvegarder le fichier
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Créer l'entrée en base de données
    db_document = models.Document(
        vehicle_id=vehicle_id,
        document_type=document_type,
        file_path=file_path,
        file_name=file.filename,
        file_size=len(content),
        upload_date=date.today()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.get("/vehicle/{vehicle_id}", response_model=List[schemas.Document])
def get_vehicle_documents(vehicle_id: int, db: Session = Depends(get_db)):
    return db.query(models.Document).filter(models.Document.vehicle_id == vehicle_id).all()

@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Fichier physique non trouvé sur le serveur")
    
    from fastapi.responses import FileResponse
    return FileResponse(document.file_path, filename=document.file_name)