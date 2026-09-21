from app.database import engine
from app import models

def init_db():
    # Crée toutes les tables définies dans models.py
    models.Base.metadata.create_all(bind=engine)
    print("✅ Base de données initialisée avec succès !")

if __name__ == "__main__":
    init_db()