import { useEffect, useState } from 'react';
import { getFuels, createFuel, updateFuel, deleteFuel, getVehicles } from '../services/api';
import { Fuel, Vehicle } from '../types';
import { Plus, Trash2, Edit, Fuel as FuelIcon } from 'lucide-react';

export default function Fuels() {
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: 0,
    fuel_date: new Date().toISOString().split('T')[0],
    mileage: 0,
    liters: 0,
    price_per_liter: 0,
    total_cost: 0,
    station: '',
    full_tank: 1
  });

  useEffect(() => { 
    loadData();
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const loadData = async () => {
    try {
      const [fuelRes, vehRes] = await Promise.all([getFuels(), getVehicles()]);
      setFuels(Array.isArray(fuelRes.data) ? fuelRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) { console.error("Erreur chargement carburant", error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vehicle_id: parseInt(String(formData.vehicle_id)),
        mileage: parseInt(String(formData.mileage)) || 0,
        liters: parseFloat(String(formData.liters)) || 0,
        price_per_liter: parseFloat(String(formData.price_per_liter)) || 0,
        total_cost: parseFloat(String(formData.total_cost)) || 0,
        full_tank: parseInt(String(formData.full_tank)) || 1
      };
      if (editingId) await updateFuel(editingId, payload);
      else await createFuel(payload);
      setShowForm(false); setEditingId(null);
      setFormData({ vehicle_id: 0, fuel_date: new Date().toISOString().split('T')[0], mileage: 0, liters: 0, price_per_liter: 0, total_cost: 0, station: '', full_tank: 1 });
      loadData();
    } catch (error: any) { alert(error.response?.data?.detail || "Erreur"); }
  };

  const handleEdit = (fuel: Fuel) => {
    setEditingId(fuel.id);
    setFormData({
      vehicle_id: fuel.vehicle_id,
      fuel_date: fuel.fuel_date,
      mileage: fuel.mileage || 0,
      liters: fuel.liters || 0,
      price_per_liter: fuel.price_per_liter || 0,
      total_cost: fuel.total_cost || 0,
      station: fuel.station || '',
      full_tank: fuel.full_tank || 1
    });
    setShowForm(true);
  };

  const getVehiclePlate = (id: number) => vehicles.find(v => v.id === id)?.license_plate || 'Inconnu';
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⛽ Carburant</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{editingId ? 'Modifier' : 'Nouveau Plein'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Véhicule *</label>
              <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: parseInt(e.target.value)})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value={0}>Sélectionner</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date *</label>
              <input type="date" required value={formData.fuel_date} onChange={(e) => setFormData({...formData, fuel_date: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage *</label>
              <input type="number" required value={formData.mileage} onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Litres *</label>
              <input type="number" step="0.01" required value={formData.liters} onChange={(e) => setFormData({...formData, liters: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prix/Litre (DA) *</label>
              <input type="number" step="0.01" required value={formData.price_per_liter} onChange={(e) => setFormData({...formData, price_per_liter: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total (DA)</label>
              <input type="number" step="0.01" value={formData.total_cost} onChange={(e) => setFormData({...formData, total_cost: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Station</label>
              <input value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Plein complet</label>
              <select value={formData.full_tank} onChange={(e) => setFormData({...formData, full_tank: parseInt(e.target.value)})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value={1}>Oui</option>
                <option value={0}>Non</option>
              </select>
            </div>
            <div className="flex gap-2 items-end md:col-span-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex-1">Enregistrer</button>
              <button type="button" onClick={() => setShowForm(false)} className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow overflow-hidden border`}>
        <table className="w-full">
          <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Véhicule</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Km</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Litres</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Prix/L</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Station</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {fuels.length === 0 ? (
              <tr><td colSpan={8} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun plein enregistré</td></tr>
            ) : (
              fuels.map(fuel => (
                <tr key={fuel.id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition`}>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(fuel.fuel_date).toLocaleDateString('fr-FR')}</td>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getVehiclePlate(fuel.vehicle_id)}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fuel.mileage?.toLocaleString()} km</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fuel.liters?.toFixed(2)} L</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fmt(fuel.price_per_liter || 0)} DA</td>
                  <td className={`px-6 py-4 font-semibold text-green-600`}>{fmt(fuel.total_cost || 0)} DA</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fuel.station || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(fuel)} className="text-blue-500 hover:text-blue-400 p-1 hover:bg-blue-500/10 rounded transition"><Edit size={18} /></button>
                      <button onClick={async () => { if(confirm('Supprimer ce plein ?')) { await deleteFuel(fuel.id); loadData(); } }} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition"><Trash2 size={18} /></button>
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