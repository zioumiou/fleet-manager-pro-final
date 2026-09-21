import axios from 'axios';
import { 
  Vehicle, Maintenance, Fuel, Expense, Tire, Reminder, 
  Document, Driver, NaftalCard, NaftalTransaction, Budget, Incident,
  KPIs, Alert, VehicleTCO 
} from '../types';

// Construction intelligente de l'URL de base (pour la production)
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

// Instance axios unique
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor pour ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== VÉHICULES ====================
export const getVehicles = () => api.get<Vehicle[]>('/vehicles/');
export const createVehicle = (data: any) => api.post<Vehicle>('/vehicles/', data);
export const updateVehicle = (id: number, data: any) => api.put<Vehicle>(`/vehicles/${id}`, data);
export const deleteVehicle = (id: number) => api.delete(`/vehicles/${id}`);
export const getVehicleTCO = (id: number) => api.get<VehicleTCO>(`/vehicles/${id}/tco`);

// ==================== DOCUMENTS ====================
export const uploadDocument = (vehicleId: number, documentType: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<Document>(`/documents/vehicles/${vehicleId}/?document_type=${documentType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getVehicleDocuments = (vehicleId: number) => api.get<Document[]>(`/documents/vehicles/${vehicleId}/`);
export const deleteDocument = (docId: number) => api.delete(`/documents/${docId}`);
export const downloadDocument = (documentId: number) => {
  window.open(`${API_BASE}/documents/${documentId}/download`, '_blank');
};

// ==================== ENTRETIENS ====================
export const getMaintenances = (vehicleId?: number) => api.get<Maintenance[]>('/maintenances/', { params: { vehicle_id: vehicleId } });
export const createMaintenance = (data: any) => api.post<Maintenance>('/maintenances/', data);
export const updateMaintenance = (id: number, data: any) => api.put<Maintenance>(`/maintenances/${id}`, data);
export const deleteMaintenance = (id: number) => api.delete(`/maintenances/${id}`);

// ==================== CARBURANT ====================
export const getFuels = (vehicleId?: number) => api.get<Fuel[]>('/fuels/', { params: { vehicle_id: vehicleId } });
export const createFuel = (data: any) => api.post<Fuel>('/fuels/', data);
export const updateFuel = (id: number, data: any) => api.put<Fuel>(`/fuels/${id}`, data);
export const deleteFuel = (id: number) => api.delete(`/fuels/${id}`);

// ==================== DÉPENSES ====================
export const getExpenses = (vehicleId?: number) => api.get<Expense[]>('/expenses/', { params: { vehicle_id: vehicleId } });
export const createExpense = (data: any) => api.post<Expense>('/expenses/', data);
export const updateExpense = (id: number, data: any) => api.put<Expense>(`/expenses/${id}`, data);
export const deleteExpense = (id: number) => api.delete(`/expenses/${id}`);
export const getCategories = () => api.get('/expenses/categories');

// ==================== PNEUS ====================
export const getTires = (vehicleId?: number) => api.get<Tire[]>('/tires/', { params: { vehicle_id: vehicleId } });
export const createTire = (data: any) => api.post<Tire>('/tires/', data);
export const updateTire = (id: number, data: any) => api.put<Tire>(`/tires/${id}`, data);
export const deleteTire = (id: number) => api.delete(`/tires/${id}`);

// ==================== RAPPELS ====================
export const getReminders = () => api.get<Reminder[]>('/reminders/');
export const createReminder = (data: any) => api.post<Reminder>('/reminders/', data);
export const updateReminder = (id: number, data: any) => api.put<Reminder>(`/reminders/${id}`, data);
export const deleteReminder = (id: number) => api.delete(`/reminders/${id}`);

// ==================== CONDUCTEURS ====================
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
export const createNaftalTransaction = (data: any) => api.post<NaftalTransaction>('/naftal/transactions/', data);

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

// ==================== DASHBOARD & NOTIFICATIONS ====================
export const getKPIs = (vehicleId?: number) => api.get<KPIs>('/dashboard/kpis', { params: { vehicle_id: vehicleId } });
export const getAlerts = () => api.get<Alert[]>('/dashboard/alerts');
export const getDashboardAlerts = getAlerts;
export const getNotifications = () => api.get('/notifications/');

// ==================== EXPORTS ====================
export const exportVehiclesCSV = () => api.get('/export/vehicles/csv', { responseType: 'blob' });
export const exportVehiclesExcel = () => api.get('/export/vehicles/excel', { responseType: 'blob' });
export const exportGlobalReportPDF = () => api.get('/export/report/global/pdf', { responseType: 'blob' });
export const exportVehicleReportPDF = (vehicleId: number) => api.get(`/export/vehicle/${vehicleId}/pdf`, { responseType: 'blob' });

// ==================== UTILITAIRES ====================
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};