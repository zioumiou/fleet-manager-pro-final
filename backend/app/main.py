from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
#from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import vehicles, maintenances, fuels, expenses, dashboard, export, documents, tires, reminders, reports, budgets, incidents
from .routers import naftal
from .routers import drivers
from .routers import budgets, incidents
from fastapi.staticfiles import StaticFiles
#from .routers import auth
#from .routers import auth, documents # <-- Ajoutez documents ici
from .routers import auth, documents, notifications # <-- Ajoutez notifications
from .routers import analytics


app = FastAPI(title="FleetManager Pro API")

# Configuration CORS pour autoriser Vercel et le localhost
app.add_middleware(
   CORSMiddleware,
   allow_origins=[
       "http://localhost:5173",
       "https://fleet-manager-pro-final.vercel.app",
       "https://fleet-manager-pro-final.onrender.com"
   ],
   allow_credentials=True,
   allow_methods=["*"],  # Autorise GET, POST, PUT, DELETE, etc.
   allow_headers=["*"],  # Autorise tous les en-têtes (y compris Authorization)
)
   
# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Enregistrement des routeurs avec le préfixe /api
app.include_router(vehicles.router, prefix="/api")
app.include_router(maintenances.router, prefix="/api")
app.include_router(fuels.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(tires.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")  # ✅ Cette ligne est cruciale
app.include_router(documents.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(naftal.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.mount("/qr_codes", StaticFiles(directory="qr_codes"), name="qr_codes")
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "FleetManager API is running!"}