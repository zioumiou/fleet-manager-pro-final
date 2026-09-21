import { useEffect, useState } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder, getVehicles } from '../services/api';
import { Reminder, Vehicle } from '../types';
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: 0,
    category: 'Vidange',
    next_due_date: '',
    next_due_mileage: '' as string | number,
    notes: ''
  });

  useEffect(() => { 
    loadData();
    // Détecter le thème initial
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Observer les changements de thème
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
      const [remRes, vehRes] = await Promise.all([getReminders(), getVehicles()]);
      setReminders(Array.isArray(remRes.data) ? remRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) {
      console.error("Erreur chargement rappels", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      vehicle_id: parseInt(String(formData.vehicle_id)),
      category: formData.category,
      next_due_date: formData.next_due_date === '' ? null : formData.next_due_date,
      next_due_mileage: formData.next_due_mileage === '' ? null : parseInt(String(formData.next_due_mileage)),
      notes: formData.notes
    };

    if (!payload.vehicle_id || payload.vehicle_id === 0) { alert("Veuillez sélectionner un véhicule"); return; }
    if (!payload.category) { alert("Veuillez sélectionner un type de rappel"); return; }
    if (!payload.next_due_date && (!payload.next_due_mileage || payload.next_due_mileage === 0)) { alert("Veuillez renseigner au moins une échéance"); return; }

    try {
      if (editingId) await updateReminder(editingId, payload);
      else await createReminder(payload);
      setShowForm(false); setEditingId(null);
      setFormData({ vehicle_id: 0, category: 'Vidange', next_due_date: '', next_due_mileage: '', notes: '' });
      loadData();
    } catch (error: any) {
      let errorMessage = "Erreur lors de l'enregistrement";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      alert(errorMessage);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setFormData({
      vehicle_id: reminder.vehicle_id,
      category: reminder.category,
      next_due_date: reminder.next_due_date || '',
      next_due_mileage: reminder.next_due_mileage || '',
      notes: reminder.notes || ''
    });
    setShowForm(true);
  };

  const getStatusBadge = (status: string | undefined, days: number | null | undefined, km: number | null | undefined) => {
    const safeStatus = status || 'green';
    
    const colors: Record<string, string> = {
      green: isDarkMode ? 'bg-green-900/30 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-200',
      orange: isDarkMode ? 'bg-orange-900/30 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-200',
      red: isDarkMode ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-100 text-red-800 border-red-200'
    };
    const icons: Record<string, JSX.Element> = {
      green: <CheckCircle size={14} className="mr-1" />,
      orange: <Clock size={14} className="mr-1" />,
      red: <AlertTriangle size={14} className="mr-1" />
    };
    
    let text = "OK";
    if (safeStatus === 'red') text = "Dépassé !";
    else if (safeStatus === 'orange') {
      const parts = [];
      if (days !== null && days !== undefined && days <= 30) parts.push(`${days}j`);
      if (km !== null && km !== undefined && km <= 2000) parts.push(`${km}km`);
      text = `Bientôt (${parts.join(' ou ')})`;
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[safeStatus]}`}>
        {icons[safeStatus]} {text}
      </span>
    );
  };

  const redCount = reminders.filter(r => r.status === 'red').length;
  const orangeCount = reminders.filter(r => r.status === 'orange').length;

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
             Rappels & Entretiens
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {redCount > 0 && <span className="text-red-500 font-semibold">{redCount} critique(s)</span>}
            {redCount > 0 && orangeCount > 0 && <span className={`mx-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>•</span>}
            {orangeCount > 0 && <span className="text-orange-500 font-semibold">{orangeCount} à prévoir bientôt</span>}
          </p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ vehicle_id: 0, category: 'Vidange', next_due_date: '', next_due_mileage: '', notes: '' }); }} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nouveau Rappel
        </button>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingId ? 'Modifier le rappel' : 'Nouveau Rappel'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Véhicule *</label>
              <select 
                required 
                value={formData.vehicle_id} 
                onChange={(e) => setFormData({...formData, vehicle_id: parseInt(e.target.value)})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value={0}>Sélectionner</option>
                {vehicles.map(v => (<option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type de rappel *</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="Vidange">Vidange Huile</option>
                <option value="Révision">Révision Générale</option>
                <option value="Pneus">Changement Pneus</option>
                <option value="Assurance">Échéance Assurance</option>
                <option value="Visite Technique">Visite Technique</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date d'échéance</label>
              <input 
                type="date" 
                value={formData.next_due_date} 
                onChange={(e) => setFormData({...formData, next_due_date: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage d'échéance</label>
              <input 
                type="number" 
                value={formData.next_due_mileage} 
                onChange={(e) => setFormData({...formData, next_due_mileage: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                placeholder="Ex: 120000" 
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</label>
              <input 
                type="text" 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                placeholder="Ex: Huile 5W30..." 
              />
            </div>
            <div className="flex gap-2 items-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex-1">
                Enregistrer
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingId(null); }} 
                className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow overflow-hidden border`}>
        <table className="w-full">
          <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Véhicule</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Échéance Date</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Échéance Km</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Statut</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {reminders.length === 0 ? (
              <tr>
                <td colSpan={6} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Aucun rappel configuré
                </td>
              </tr>
            ) : (
              reminders.map((r) => (
                <tr key={r.id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition`}>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {r.vehicle_plate || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                      {r.category}
                    </span>
                    {r.notes && <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{r.notes}</p>}
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {r.next_due_date ? new Date(String(r.next_due_date)).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {r.next_due_mileage ? `${Number(r.next_due_mileage).toLocaleString()} km` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(r.status, r.days_remaining, r.km_remaining)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(r)} 
                        className="text-blue-500 hover:text-blue-400 p-1 hover:bg-blue-500/10 rounded transition"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={async () => { if(confirm('Supprimer ce rappel ?')) { await deleteReminder(r.id); loadData(); } }} 
                        className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition"
                        title="Supprimer"
                      >
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