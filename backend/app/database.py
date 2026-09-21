import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuration de la base de données (chemin relatif pour la portabilité)
DATABASE_URL = "sqlite:///./data/fleet.db"

# Création du moteur de base de données
# check_same_thread=False est nécessaire pour SQLite avec FastAPI
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Création de la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Fonction pour obtenir la session de base de données (utilisée par FastAPI Depends)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()