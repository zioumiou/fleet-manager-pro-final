export interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  fuel_type: string;
  current_mileage: number;
  initial_mileage: number;
  purchase_date: string;
  purchase_price: number;
  resale_price?: number;
  status: string;
}

export interface Maintenance {
  id: number;
  vehicle_id: number;
  maintenance_date: string;
  mileage: number;
  maintenance_type: string;
  description?: string;
  cost: number;
  garage?: string;
}

export interface Fuel {
  id: number;
  vehicle_id: number;
  fuel_date: string;
  mileage: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  station?: string;
  full_tank: number | boolean;
}

export interface Expense {
  id: number;
  vehicle_id: number;
  category_id: number;
  expense_date: string;
  description: string;
  amount: number;
}

export interface Tire {
  id: number;
  vehicle_id: number;
  change_date: string;
  mileage: number;
  tire_type: string;
  brand?: string;
  cost: number;
  position?: string;
}

export interface Reminder {
  id: number;
  vehicle_id: number;          // ✅ Ajouté
  vehicle_plate: string;
  category: string;
  next_due_date: string;
  next_due_mileage?: number;   // ✅ Ajouté
  km_threshold?: number;
  km_remaining?: number;       // ✅ Ajouté
  days_remaining?: number;     // ✅ Ajouté
  description: string;
  notes?: string;              // ✅ Ajouté
  status?: string;
}

export interface Document {
  id: number;
  vehicle_id: number;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  upload_date: string;
}

export interface KPIs {
  total_vehicles: number;
  total_mileage: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_expenses: number;
  total_tire_cost: number;
  average_consumption: number;
  cost_per_km: number;
  active_alerts: number;
  avg_distance_between_fuels: number;
  daily_distance: number;
  daily_cost: number;
  monthly_cost: number;
  fuels_this_month: number;
  most_expensive_vehicle: string | null;
  avg_holding_days: number;
  depreciation_per_day: number;
  total_fuel_count: number;
  maintenance_count: number;
}

export interface Alert {
  vehicle_id: number;
  license_plate: string;
  item_name: string;
  alert_type: string;
  current_value: number;
  threshold_value: number;
  km_remaining: number;
  days_remaining?: number;     // ✅ Ajouté
  severity: string;
}

export interface VehicleTCO {
  vehicle_id: number;
  total_tco: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_expenses: number;
  total_tire_cost: number;
  depreciation: number;
}

export interface NaftalCard {
  id: number;
  card_number: string;
  vehicle_id: number;
  monthly_limit: number;
  current_balance: number;
  expiration_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface NaftalTransaction {
  id: number;
  card_id: number;
  transaction_date: string;
  amount: number;
  liters?: number;
  station?: string;
  mileage?: number;
}

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  license_expiry?: string;
  phone?: string;
  assigned_vehicle_id?: number;
  is_active: boolean;
}

export interface Budget {
  id: number;
  vehicle_id: number | null;
  category: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Incident {
  id: number;
  vehicle_id: number;
  incident_date: string;
  incident_type: string;
  description: string;
  cost: number | null;
  status: string;
  notes: string | null;
}