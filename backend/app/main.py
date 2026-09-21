from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth, vehicles, maintenances, fuels, expenses, 
    tires, reminders, documents, drivers, naftal, 
    budgets, incidents, dashboard, export, analytics
)

app = FastAPI(title="FleetManager Pro API", version="2.5.0")

# ✅ Configuration CORS pour autoriser Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://fleet-manager-pro-final.vercel.app",
        "https://fleet-manager-pro-final.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Inclusion de toutes les routes avec le préfixe /api
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(vehicles.router, prefix="/api", tags=["Vehicles"])
app.include_router(maintenances.router, prefix="/api", tags=["Maintenances"])
app.include_router(fuels.router, prefix="/api", tags=["Fuels"])
app.include_router(expenses.router, prefix="/api", tags=["Expenses"])
app.include_router(tires.router, prefix="/api", tags=["Tires"])
app.include_router(reminders.router, prefix="/api", tags=["Reminders"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(drivers.router, prefix="/api", tags=["Drivers"])
app.include_router(naftal.router, prefix="/api", tags=["Naftal"])
app.include_router(budgets.router, prefix="/api", tags=["Budgets"])
app.include_router(incidents.router, prefix="/api", tags=["Incidents"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"]) # ✅ Route pour l'IA
app.include_router(export.router, prefix="/api", tags=["Export"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "FleetManager Pro API is live!"}