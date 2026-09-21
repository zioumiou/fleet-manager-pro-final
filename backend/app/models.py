from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date
from .database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    fuel_type = Column(String, nullable=False, default="Essence")
    engine_type = Column(String, nullable=True)
    transmission = Column(String, nullable=True)
    initial_mileage = Column(Integer, nullable=False, default=0)
    current_mileage = Column(Integer, nullable=False, default=0)
    driver_name = Column(String, nullable=True)
    purchase_price = Column(Float, nullable=True)
    resale_price = Column(Float, nullable=True)
    purchase_date = Column(Date, nullable=True)
    resale_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="Actif")
    
    drivers = relationship("Driver", back_populates="vehicle")
    naftal_cards = relationship("NaftalCard", back_populates="vehicle", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="vehicle", cascade="all, delete-orphan")
    maintenances = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")
    fuels = relationship("Fuel", back_populates="vehicle", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="vehicle", cascade="all, delete-orphan")
    tires = relationship("Tire", back_populates="vehicle", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="vehicle", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="vehicle", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="vehicle", cascade="all, delete-orphan")

class Maintenance(Base):
    __tablename__ = "maintenances"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    maintenance_date = Column(Date)
    mileage = Column(Integer)
    maintenance_type = Column(String)
    description = Column(String, nullable=True)
    cost = Column(Float)
    garage = Column(String, nullable=True)
    vehicle = relationship("Vehicle", back_populates="maintenances")

class Fuel(Base):
    __tablename__ = "fuels"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    fuel_date = Column(Date)
    mileage = Column(Integer)
    liters = Column(Float)
    price_per_liter = Column(Float)
    total_cost = Column(Float)
    station = Column(String, nullable=True)
    full_tank = Column(Integer)
    vehicle = relationship("Vehicle", back_populates="fuels")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    category_id = Column(Integer)
    expense_date = Column(Date)
    description = Column(String)
    amount = Column(Float)
    vehicle = relationship("Vehicle", back_populates="expenses")

class Tire(Base):
    __tablename__ = "tires"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    change_date = Column(Date)
    mileage = Column(Integer)
    tire_type = Column(String)
    brand = Column(String)
    position = Column(String)
    cost = Column(Float)
    notes = Column(String, nullable=True)
    vehicle = relationship("Vehicle", back_populates="tires")

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    category = Column(String)
    next_due_date = Column(Date, nullable=True)
    next_due_mileage = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    vehicle = relationship("Vehicle", back_populates="reminders")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_date = Column(Date, nullable=False, default=date.today)
    vehicle = relationship("Vehicle", back_populates="documents")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    license_expiry = Column(Date, nullable=True)
    phone = Column(String(20), nullable=True)
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    vehicle = relationship("Vehicle", back_populates="drivers")

class NaftalCard(Base):
    __tablename__ = "naftal_cards"
    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String(50), unique=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    monthly_limit = Column(Float, nullable=False, default=0)
    current_balance = Column(Float, nullable=False, default=0)
    expiration_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    vehicle = relationship("Vehicle", back_populates="naftal_cards")
    transactions = relationship("NaftalTransaction", back_populates="card", cascade="all, delete-orphan")

class NaftalTransaction(Base):
    __tablename__ = "naftal_transactions"
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("naftal_cards.id"), nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float, nullable=False)
    liters = Column(Float, nullable=True)
    station = Column(String(100), nullable=True)
    mileage = Column(Integer, nullable=True)
    card = relationship("NaftalCard", back_populates="transactions")

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    vehicle = relationship("Vehicle", back_populates="budgets")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    incident_date = Column(Date, nullable=False)
    incident_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    cost = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="En cours")
    notes = Column(String, nullable=True)
    vehicle = relationship("Vehicle", back_populates="incidents")
    
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")  # 'admin', 'manager', 'user'    