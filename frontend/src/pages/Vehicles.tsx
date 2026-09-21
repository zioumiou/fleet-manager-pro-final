import { useEffect, useState } from 'react';
import { 
  getVehicles, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle, 
  getVehicleTCO, 
  exportVehiclesCSV, 
  exportVehiclesExcel, 
  downloadFile 
} from '../services/api';
import { Vehicle } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  FileText, 
  QrCode, 
  Calculator 
} from 'lucide-react';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'Essence',
    current_mileage: 0,
    initial_mileage: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    resale_price: 0,
    status: 'Actif'
  });

  useEffect(() => { 
    loadData();
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const loadData = async () => {
    try {
      const res = await getVehicles();
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement véhicules", error);
    }
  };

  const extractErrorMessage = (error: any): string => {
    if (!error.response?.data?.detail) return "Erreur lors de l'enregistrement";
    const detail = error.response.data.detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg || JSON.stringify(d)).join('\n');
    }
    if (typeof detail === 'string') return detail;
    return JSON.stringify(detail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        year: parseInt(String(formData.year)) || new Date().getFullYear(),
        current_mileage: parseInt(String(formData.current_mileage)) || 0,
        initial_mileage: parseInt(String(formData.initial_mileage)) || 0,
        purchase_price: parseFloat(String(formData.purchase_price)) || 0,
        resale_price: formData.resale_price ? parseFloat(String(formData.resale_price)) : null,
        purchase_date: formData.purchase_date || null
      };
      if (editingId) await updateVehicle(editingId, payload);
      else await createVehicle(payload);
      
      setShowForm(false);
      setEditingId(null);
      setFormData({
        license_plate: '', brand: '', model: '', year: new Date().getFullYear(),
        fuel_type: 'Essence', current_mileage: 0, initial_mileage: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: 0, resale_price: 0, status: 'Actif'
      });
      loadData();
    } catch (error: any) {
      alert(extractErrorMessage(error));
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      license_plate: vehicle.license_plate || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      fuel_type: vehicle.fuel_type || 'Essence',
      current_mileage: vehicle.current_mileage || 0,
      initial_mileage: vehicle.initial_mileage || 0,
      purchase_date: vehicle.purchase_date || new Date().toISOString().split('T')[0],
      purchase_price: vehicle.purchase_price || 0,
      resale_price: vehicle.resale_price || 0,
      status: vehicle.status || 'Actif'
    });
    setShowForm(true);
  };

  const handleTCO = async (id: number) => {
    try {
      const res = await getVehicleTCO(id);
      alert(`Coût Total de Possession: ${res.data.total_tco.toFixed(2)} DA`);
    } catch (error) {
      alert("Erreur lors du calcul du TCO");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await exportVehiclesCSV();
      downloadFile(res.data, 'vehicles.csv');
    } catch (error) {
      alert("Erreur lors de l'export CSV");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await exportVehiclesExcel();
      downloadFile(res.data, 'vehicles.xlsx');
    } catch (error) {
      alert("Erreur lors de l'export Excel");
    }
  };

  const handleDownloadPDF = async (vehicleId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/vehicle/${vehicleId}/pdf`);
      if (!response.ok) throw new Error("Erreur");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiche_vehicule_${vehicleId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erreur lors de la génération du PDF");
    }
  };

  const handleShowQR = (vehicleId: number) => {
    const qrUrl = `http://localhost:8000/qr_codes/vehicle_${vehicleId}.png`;
    window.open(qrUrl, '_blank');
  };

  return (
    <div className={`p-2 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          🚗 Véhicules
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
          >
            {isDarkMode ? '☀️ Light' : ' Dark'}
          </button>
          <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <Download size={18} /> CSV
          </button>
          <button onClick={handleExportExcel} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Download size={18} /> Excel
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20} /> Ajouter
          </button>
        </div>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingId ? 'Modifier le véhicule' : 'Nouveau Véhicule'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Plaque *</label>
              <input required value={formData.license_plate} onChange={(e) => setFormData({...formData, license_plate: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Marque *</label>
              <input required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Modèle *</label>
              <input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Année</label>
              <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Carburant</label>
              <select value={formData.fuel_type} onChange={(e) => setFormData({...formData, fuel_type: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage actuel *</label>
              <input type="number" required value={formData.current_mileage} onChange={(e) => setFormData({...formData, current_mileage: parseInt(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage initial</label>
              <input type="number" value={formData.initial_mileage} onChange={(e) => setFormData({...formData, initial_mileage: parseInt(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date d'achat</label>
              <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prix d'achat (DA)</label>
              <input type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prix de revente (DA)</label>
              <input type="number" step="0.01" value={formData.resale_price} onChange={(e) => setFormData({...formData, resale_price: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statut</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="Vendu">Vendu</option>
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Enregistrer</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className={`px-6 py-2 rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-gray-300`}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
        <table className="w-full">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Plaque</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Marque/Modèle</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Année</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Kilométrage</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Statut</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {vehicles.length === 0 ? (
              <tr><td colSpan={6} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun véhicule enregistré</td></tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{vehicle.license_plate}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{vehicle.brand} {vehicle.model}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{vehicle.year}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{vehicle.current_mileage.toLocaleString()} km</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      vehicle.status === 'Actif' ? 'bg-green-100 text-green-800' : 
                      vehicle.status === 'Inactif' ? 'bg-gray-100 text-gray-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleTCO(vehicle.id)} className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-50 rounded" title="TCO">
                        <Calculator size={18} />
                      </button>
                      <button onClick={() => handleDownloadPDF(vehicle.id)} className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded" title="Fiche PDF">
                        <FileText size={18} />
                      </button>
                      <button onClick={() => handleShowQR(vehicle.id)} className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-50 rounded" title="QR Code">
                        <QrCode size={18} />
                      </button>
                      <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded" title="Modifier">
                        <Edit size={18} />
                      </button>
                      <button onClick={async () => { if(confirm('Supprimer ce véhicule ?')) { await deleteVehicle(vehicle.id); loadData(); } }} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}