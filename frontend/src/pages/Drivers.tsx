import { useEffect, useState } from 'react';
import { getDrivers, createDriver, updateDriver, deleteDriver, getVehicles } from '../services/api';
import { Driver, Vehicle } from '../types';
import { Plus, Trash2, Edit, UserCheck, UserX } from 'lucide-react';

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    license_number: '',
    license_expiry: '',
    phone: '',
    assigned_vehicle_id: 0,
    is_active: true
  });

  useEffect(() => { 
    loadData();
    // Détecter le thème système
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const loadData = async () => {
    try {
      const [driverRes, vehRes] = await Promise.all([getDrivers(), getVehicles()]);
      setDrivers(Array.isArray(driverRes.data) ? driverRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) {
      console.error("Erreur chargement conducteurs", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        assigned_vehicle_id: formData.assigned_vehicle_id === 0 ? null : formData.assigned_vehicle_id
      };
      if (editingId) {
        await updateDriver(editingId, payload);
      } else {
        await createDriver(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ first_name: '', last_name: '', license_number: '', license_expiry: '', phone: '', assigned_vehicle_id: 0, is_active: true });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erreur");
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setFormData({
      first_name: driver.first_name,
      last_name: driver.last_name,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry || '',
      phone: driver.phone || '',
      assigned_vehicle_id: driver.assigned_vehicle_id || 0,
      is_active: driver.is_active
    });
    setShowForm(true);
  };

  const getVehiclePlate = (id?: number) => {
    if (!id) return 'Non assigné';
    return vehicles.find(v => v.id === id)?.license_plate || 'Inconnu';
  };

  // Classes CSS pour les thèmes
  const themeClasses = {
    container: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900',
    card: isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200',
    input: isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900',
    select: isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    button: {
      primary: isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      danger: isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
    },
    badge: {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    }
  };

  return (
    <div className={`p-2 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          👥 Conducteurs
        </h1>
        <div className="flex gap-4">
          {/* Toggle Theme */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} /> Nouveau Conducteur
          </button>
        </div>
      </div>

      {showForm && (
        <div className={`${themeClasses.card} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingId ? 'Modifier' : 'Nouveau Conducteur'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Prénom *
              </label>
              <input 
                required 
                value={formData.first_name} 
                onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nom *
              </label>
              <input 
                required 
                value={formData.last_name} 
                onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                N° Permis *
              </label>
              <input 
                required 
                value={formData.license_number} 
                onChange={(e) => setFormData({...formData, license_number: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Expiration Permis
              </label>
              <input 
                type="date" 
                value={formData.license_expiry} 
                onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Téléphone
              </label>
              <input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Véhicule Assigné
              </label>
              <select 
                value={formData.assigned_vehicle_id} 
                onChange={(e) => setFormData({...formData, assigned_vehicle_id: parseInt(e.target.value)})} 
                className={`w-full border rounded-lg px-3 py-2 ${themeClasses.select}`}
              >
                <option value={0}>Non assigné</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.license_plate}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end md:col-span-3">
              <button type="submit" className={`${themeClasses.button.primary} px-6 py-2 rounded-lg`}>
                Enregistrer
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className={`${themeClasses.button.secondary} px-6 py-2 rounded-lg`}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map(driver => (
          <div key={driver.id} className={`${themeClasses.card} p-6 rounded-lg shadow border-l-4 ${driver.is_active ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start mb-3">
              {driver.is_active ? <UserCheck size={32} className="text-green-600" /> : <UserX size={32} className="text-red-600" />}
              <span className={`px-2 py-1 rounded text-xs ${driver.is_active ? themeClasses.badge.active : themeClasses.badge.inactive}`}>
                {driver.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {driver.first_name} {driver.last_name}
            </h3>
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Permis: {driver.license_number}
            </p>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🚗 {getVehiclePlate(driver.assigned_vehicle_id)}
            </p>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              📞 {driver.phone || 'Non renseigné'}
            </p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleEdit(driver)} 
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 flex items-center justify-center gap-1"
              >
                <Edit size={14} /> Modifier
              </button>
              <button 
                onClick={async () => { 
                  if(confirm('Supprimer ce conducteur ?')) { 
                    await deleteDriver(driver.id); 
                    loadData(); 
                  } 
                }} 
                className="text-red-600 p-2 hover:bg-red-50 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}