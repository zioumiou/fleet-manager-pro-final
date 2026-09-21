import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const exportVehiclesCSV = async () => {
  const response = await api.get('/export/vehicles/csv', { responseType: 'blob' });
  return response.data;
};

export const exportVehiclesExcel = async () => {
  const response = await api.get('/export/vehicles/excel', { responseType: 'blob' });
  return response.data;
};

export const exportGlobalReportPDF = async () => {
  const response = await api.get('/export/report/pdf', { responseType: 'blob' });
  return response.data;
};

export const exportVehicleReportPDF = async (vehicleId: number) => {
  const response = await api.get(`/export/vehicle/${vehicleId}/pdf`, { responseType: 'blob' });
  return response.data;
};

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