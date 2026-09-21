import { useEffect, useState } from 'react';
import { getTires, createTire, updateTire, deleteTire, getVehicles } from '../services/api';
import { Tire, Vehicle } from '../types';
import { Plus, Trash2, Edit, Disc } from 'lucide-react';

export default function Tires() {
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: 0,
    change_date: new Date().toISOString().split('T')[0],
    mileage: 0,
    tire_type: 'Été',
    brand: '',
    position: 'Avant Gauche',
    cost: 0,
    notes: ''
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
      const [tireRes, vehRes] = await Promise.all([getTires(), getVehicles()]);
      setTires(Array.isArray(tireRes.data) ? tireRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) { console.error("Erreur chargement pneus", error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vehicle_id: parseInt(String(formData.vehicle_id)),
        mileage: parseInt(String(formData.mileage)) || 0,
        cost: parseFloat(String(formData.cost)) || 0
      };
      if (editingId) await updateTire(editingId, payload);
      else await createTire(payload);
      setShowForm(false); setEditingId(null);
      setFormData({ vehicle_id: 0, change_date: new Date().toISOString().split('T')[0], mileage: 0, tire_type: 'Été', brand: '', position: 'Avant Gauche', cost: 0, notes: '' });
      loadData();
    } catch (error: any) { alert(error.response?.data?.detail || "Erreur"); }
  };

  const handleEdit = (tire: Tire) => {
    setEditingId(tire.id);
    setFormData({
      vehicle_id: tire.vehicle_id,
      change_date: tire.change_date,
      mileage: tire.mileage || 0,
      tire_type: tire.tire_type || 'Été',
      brand: tire.brand || '',
      position: tire.position || 'Avant Gauche',
      cost: tire.cost || 0,
      notes: tire.notes || ''
    });
    setShowForm(true);
  };

  const getVehiclePlate = (id: number) => vehicles.find(v => v.id === id)?.license_plate || 'Inconnu';
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> Pneus</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{editingId ? 'Modifier' : 'Nouveau Pneus'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Véhicule *</label>
              <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: parseInt(e.target.value)})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value={0}>Sélectionner</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date de changement *</label>
              <input type="date" required value={formData.change_date} onChange={(e) => setFormData({...formData, change_date: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage *</label>
              <input type="number" required value={formData.mileage} onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
              <select value={formData.tire_type} onChange={(e) => setFormData({...formData, tire_type: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value="Été">Été</option>
                <option value="Hiver">Hiver</option>
                <option value="Toutes saisons">Toutes saisons</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Marque</label>
              <input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Position</label>
              <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value="Avant Gauche">Avant Gauche</option>
                <option value="Avant Droit">Avant Droit</option>
                <option value="Arrière Gauche">Arrière Gauche</option>
                <option value="Arrière Droit">Arrière Droit</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coût (DA)</label>
              <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</label>
              <input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
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
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Marque</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Position</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Km</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coût</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {tires.length === 0 ? (
              <tr><td colSpan={8} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun pneu enregistré</td></tr>
            ) : (
              tires.map(tire => (
                <tr key={tire.id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition`}>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(tire.change_date).toLocaleDateString('fr-FR')}</td>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getVehiclePlate(tire.vehicle_id)}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tire.tire_type}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tire.brand || '-'}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tire.position}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tire.mileage?.toLocaleString()} km</td>
                  <td className={`px-6 py-4 font-semibold text-green-600`}>{fmt(tire.cost || 0)} DA</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(tire)} className="text-blue-500 hover:text-blue-400 p-1 hover:bg-blue-500/10 rounded transition"><Edit size={18} /></button>
                      <button onClick={async () => { if(confirm('Supprimer ce pneu ?')) { await deleteTire(tire.id); loadData(); } }} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition"><Trash2 size={18} /></button>
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