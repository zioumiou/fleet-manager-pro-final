from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import des routeurs (assurez-vous que ces fichiers existent dans app/routers/)
from app.routers import (
    vehicles, maintenances, fuels, expenses, dashboard, 
    export, documents, tires, reminders, budgets, 
    incidents, drivers, naftal, auth
)

# Initialisation de l'application FastAPI
app = FastAPI(
    title="FleetManager Pro API",
    description="API de gestion de flotte automobile professionnelle",
    version="2.5.0"
)

# ==========================================
# CONFIGURATION CORS (CRUCIAL POUR VERCEL + RENDER)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://fleet-manager-pro-final.vercel.app",
        "https://fleet-manager-pro-final.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Autorise GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],  # Autorise tous les en-têtes (y compris Authorization pour le JWT)
)

# ==========================================
# INCLUSION DES ROUTEURS
# ==========================================
# Le préfixe "/api" est ajouté ici pour correspondre à la configuration du frontend (api.ts)
app.include_router(auth.router, prefix="/api", tags=["Authentification"])
app.include_router(vehicles.router, prefix="/api", tags=["Véhicules"])
app.include_router(maintenances.router, prefix="/api", tags=["Entretiens"])
app.include_router(fuels.router, prefix="/api", tags=["Carburant"])
app.include_router(expenses.router, prefix="/api", tags=["Dépenses"])
app.include_router(tires.router, prefix="/api", tags=["Pneus"])
app.include_router(reminders.router, prefix="/api", tags=["Rappels"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(drivers.router, prefix="/api", tags=["Conducteurs"])
app.include_router(naftal.router, prefix="/api", tags=["Cartes Naftal"])
app.include_router(budgets.router, prefix="/api", tags=["Budgets"])
app.include_router(incidents.router, prefix="/api", tags=["Incidents"])
app.include_router(dashboard.router, prefix="/api", tags=["Tableau de Bord"])
app.include_router(export.router, prefix="/api", tags=["Exports"])

# ==========================================
# ENDPOINT DE SANTÉ (HEALTH CHECK)
# ==========================================
@app.get("/")
def read_root():
    return {
        "message": "FleetManager Pro API is running successfully!",
        "status": "healthy",
        "cors": "enabled"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}