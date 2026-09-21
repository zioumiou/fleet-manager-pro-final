"""
Script de sauvegarde automatique de la base de données FleetManager
À exécuter quotidiennement via le Planificateur de tâches Windows
"""
import shutil
import os
from datetime import datetime

# Configuration
DB_SOURCE = "../data/fleet.db"  # Nom de votre base de données SQLite
BACKUP_DIR = "backups"

def create_backup():
    """Crée une sauvegarde datée de la base de données"""
    
    # Créer le dossier backups s'il n'existe pas
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"✅ Dossier '{BACKUP_DIR}' créé")
    
    # Vérifier que la base de données existe
    if not os.path.exists(DB_SOURCE):
        print(f"❌ Base de données '{DB_SOURCE}' introuvable")
        return False
    
    # Nom du fichier de sauvegarde avec date et heure
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"fleet_backup_{timestamp}.db"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    try:
        # Copier la base de données
        shutil.copy2(DB_SOURCE, backup_path)
        print(f"✅ Sauvegarde créée : {backup_path}")
        
        # Nettoyer les anciennes sauvegardes (garder les 30 derniers jours)
        cleanup_old_backups(days_to_keep=30)
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde : {e}")
        return False

def cleanup_old_backups(days_to_keep=30):
    """Supprime les sauvegardes de plus de X jours"""
    cutoff_date = datetime.now().timestamp() - (days_to_keep * 24 * 3600)
    
    for filename in os.listdir(BACKUP_DIR):
        if filename.startswith("fleet_backup_") and filename.endswith(".db"):
            file_path = os.path.join(BACKUP_DIR, filename)
            file_age = os.path.getmtime(file_path)
            
            if file_age < cutoff_date:
                os.remove(file_path)
                print(f"️  Ancienne sauvegarde supprimée : {filename}")

if __name__ == "__main__":
    print(f"🚀 Démarrage de la sauvegarde - {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    create_backup()
    print("✅ Sauvegarde terminée")