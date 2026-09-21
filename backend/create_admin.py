from app.database import SessionLocal, engine, Base
from app import models, auth

# S'assurer que toutes les tables (y compris 'users') sont créées
Base.metadata.create_all(bind=engine)

db = SessionLocal()
email = "admin@fleet.com"

# Vérifier si l'utilisateur existe déjà
user = db.query(models.User).filter(models.User.email == email).first()

if not user:
    new_user = models.User(
        email=email,
        hashed_password=auth.get_password_hash("admin123"),
        full_name="Administrateur",
        role="admin"
    )
    db.add(new_user)
    db.commit()
    print("✅ Compte admin créé avec succès !")
    print("📧 Email: admin@fleet.com")
    print("🔑 Mot de passe: admin123")
else:
    print("ℹ️ Le compte admin existe déjà.")

db.close()