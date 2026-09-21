from app.database import SessionLocal
from app import models, auth

def create_admin():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == "admin@fleet.com").first()
        if not admin:
            hashed_password = auth.get_password_hash("admin123")
            new_admin = models.User(
                email="admin@fleet.com",
                hashed_password=hashed_password,
                is_active=True,
                is_superuser=True
            )
            db.add(new_admin)
            db.commit()
            print("✅ Compte admin créé avec succès !")
            print("📧 Email: admin@fleet.com")
            print("🔑 Mot de passe: admin123")
        else:
            print("ℹ️ Le compte admin existe déjà.")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()