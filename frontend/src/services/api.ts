import axios from 'axios';
import { 
  Vehicle, Maintenance, Fuel, Expense, Tire, Reminder, 
  Document, Driver, NaftalCard, NaftalTransaction, Budget, Incident 
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token JWT automatiquement à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== VEHICLES ====================
export const getVehicles = () => api.get<Vehicle[]>('/vehicles/');
export const createVehicle = (data: any) => api.post<Vehicle>('/vehicles/', data);
export const updateVehicle = (id: number, data: any) => api.put<Vehicle>(`/vehicles/${id}`, data);
export const deleteVehicle = (id: number) => api.delete(`/vehicles/${id}`);
export const getVehicleTCO = (id: number) => api.get(`/vehicles/${id}/tco`);
export const exportVehiclesCSV = () => api.get('/export/vehicles/csv', { responseType: 'blob' });
export const exportVehiclesExcel = () => api.get('/export/vehicles/excel', { responseType: 'blob' });

// ==================== MAINTENANCES ====================
export const getMaintenances = () => api.get<Maintenance[]>('/maintenances/');
export const createMaintenance = (data: any) => api.post<Maintenance>('/maintenances/', data);
export const updateMaintenance = (id: number, data: any) => api.put<Maintenance>(`/maintenances/${id}`, data);
export const deleteMaintenance = (id: number) => api.delete(`/maintenances/${id}`);

// ==================== FUELS ====================
export const getFuels = () => api.get<Fuel[]>('/fuels/');
export const createFuel = (data: any) => api.post<Fuel>('/fuels/', data);
export const updateFuel = (id: number, data: any) => api.put<Fuel>(`/fuels/${id}`, data);
export const deleteFuel = (id: number) => api.delete(`/fuels/${id}`);

// ==================== EXPENSES ====================
export const getExpenses = () => api.get<Expense[]>('/expenses/');
export const createExpense = (data: any) => api.post<Expense>('/expenses/', data);
export const updateExpense = (id: number, data: any) => api.put<Expense>(`/expenses/${id}`, data);
export const deleteExpense = (id: number) => api.delete(`/expenses/${id}`);

// ✅ Alias pour Expenses.tsx qui cherche getCategories
export const getCategories = () => api.get('/expenses/categories');

// ==================== TIRES ====================
export const getTires = () => api.get<Tire[]>('/tires/');
export const createTire = (data: any) => api.post<Tire>('/tires/', data);
export const updateTire = (id: number, data: any) => api.put<Tire>(`/tires/${id}`, data);
export const deleteTire = (id: number) => api.delete(`/tires/${id}`);

// ==================== REMINDERS ====================
export const getReminders = () => api.get<Reminder[]>('/reminders/');
export const createReminder = (data: any) => api.post<Reminder>('/reminders/', data);
export const updateReminder = (id: number, data: any) => api.put<Reminder>(`/reminders/${id}`, data);
export const deleteReminder = (id: number) => api.delete(`/reminders/${id}`);

// ==================== DRIVERS ====================
export const getDrivers = () => api.get<Driver[]>('/drivers/');
export const createDriver = (data: any) => api.post<Driver>('/drivers/', data);
export const updateDriver = (id: number, data: any) => api.put<Driver>(`/drivers/${id}`, data);
export const deleteDriver = (id: number) => api.delete(`/drivers/${id}`);

// ==================== NAFTAL CARDS ====================
export const getNaftalCards = () => api.get<NaftalCard[]>('/naftal/cards/');
export const createNaftalCard = (data: any) => api.post<NaftalCard>('/naftal/cards/', data);
export const updateNaftalCard = (id: number, data: any) => api.put<NaftalCard>(`/naftal/cards/${id}`, data);
export const deleteNaftalCard = (id: number) => api.delete(`/naftal/cards/${id}`);
export const getNaftalTransactions = (cardId: number) => api.get<NaftalTransaction[]>(`/naftal/cards/${cardId}/transactions`);
export const createNaftalTransaction = (cardId: number, data: any) => api.post<NaftalTransaction>(`/naftal/cards/${cardId}/transactions`, data);

// ==================== BUDGETS ====================
export const getBudgets = () => api.get<Budget[]>('/budgets/');
export const createBudget = (data: any) => api.post<Budget>('/budgets/', data);
export const updateBudget = (id: number, data: any) => api.put<Budget>(`/budgets/${id}`, data);
export const deleteBudget = (id: number) => api.delete(`/budgets/${id}`);

// ==================== INCIDENTS ====================
export const getIncidents = () => api.get<Incident[]>('/incidents/');
export const createIncident = (data: any) => api.post<Incident>('/incidents/', data);
export const updateIncident = (id: number, data: any) => api.put<Incident>(`/incidents/${id}`, data);
export const deleteIncident = (id: number) => api.delete(`/incidents/${id}`);

// ==================== DOCUMENTS ====================
export const uploadDocument = async (formData: FormData) => {
  return api.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getVehicleDocuments = (vehicleId: number) => 
  api.get<Document[]>(`/documents/vehicle/${vehicleId}`);

export const downloadDocument = (documentId: number) => {
  window.open(`http://localhost:8000/api/documents/${documentId}/download`, '_blank');
};

// ==================== DASHBOARD ====================
export const getDashboardKPIs = () => api.get('/dashboard/kpis');
export const getDashboardAlerts = () => api.get('/dashboard/alerts');

// ✅ Alias pour Dashboard.tsx
export const getKPIs = getDashboardKPIs;
export const getAlerts = getDashboardAlerts;
// ==================== NOTIFICATIONS ====================
export const getNotifications = () => api.get('/notifications/');

// ==================== UTILS ====================
export const downloadFile = (data: any, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};