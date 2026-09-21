import { useEffect, useState } from 'react';
import { getIncidents, createIncident, updateIncident, deleteIncident, getVehicles } from '../services/api';
import { Incident, Vehicle } from '../types';
import { Plus, Trash2, Edit, AlertTriangle, FileText } from 'lucide-react';

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: 0, 
    incident_date: new Date().toISOString().split('T')[0], 
    incident_type: 'Accident',
    description: '', 
    cost: 0, 
    status: 'En cours', 
    notes: ''
  });

  useEffect(() => { 
    loadData();
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const loadData = async () => {
    try {
      const [incRes, vehRes] = await Promise.all([getIncidents(), getVehicles()]);
      setIncidents(Array.isArray(incRes.data) ? incRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) { console.error("Erreur chargement incidents", error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        vehicle_id: parseInt(String(formData.vehicle_id)), 
        cost: formData.cost ? parseFloat(String(formData.cost)) : null 
      };
      if (editingId) await updateIncident(editingId, payload);
      else await createIncident(payload);
      setShowForm(false); setEditingId(null);
      setFormData({ vehicle_id: 0, incident_date: new Date().toISOString().split('T')[0], incident_type: 'Accident', description: '', cost: 0, status: 'En cours', notes: '' });
      loadData();
    } catch (error: any) { alert(error.response?.data?.detail || "Erreur"); }
  };

  const handleEdit = (incident: Incident) => {
    setEditingId(incident.id);
    setFormData({ 
      vehicle_id: incident.vehicle_id, 
      incident_date: incident.incident_date, 
      incident_type: incident.incident_type, 
      description: incident.description, 
      cost: incident.cost || 0, 
      status: incident.status, 
      notes: incident.notes || '' 
    });
    setShowForm(true);
  };

  const handleDownloadPDF = (incidentId: number) => {
    window.open(`http://localhost:8000/api/reports/incident/${incidentId}/pdf`, '_blank');
  };

  const getVehiclePlate = (id: number) => vehicles.find(v => v.id === id)?.license_plate || 'Inconnu';
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const getStatusColor = (status: string) => {
    if (status === 'En cours') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (status === 'Résolu') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <div className={`p-2 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🚨 Gestion des Incidents</h1>
        <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
          <Plus size={20} /> Nouvel Incident
        </button>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-red-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{editingId ? 'Modifier' : 'Nouvel Incident'}</h2>
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
              <input type="date" required value={formData.incident_date} onChange={(e) => setFormData({...formData, incident_date: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type *</label>
              <select value={formData.incident_type} onChange={(e) => setFormData({...formData, incident_type: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value="Accident">Accident</option><option value="Vol">Vol</option><option value="Panne">Panne</option><option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coût estimé (DA)</label>
              <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statut</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value="En cours">En cours</option><option value="Résolu">Résolu</option><option value="Assurance">En cours d'assurance</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
              <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows={3}></textarea>
            </div>
            <div className="md:col-span-3">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes / Détails</label>
              <input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div className="flex gap-2 items-end md:col-span-3">
              <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">Enregistrer</button>
              <button type="button" onClick={() => setShowForm(false)} className={`px-6 py-2 rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
        <table className="w-full">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Véhicule</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Type</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Description</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Coût</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Statut</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {incidents.length === 0 ? (
              <tr><td colSpan={7} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun incident enregistré</td></tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{new Date(inc.incident_date).toLocaleDateString('fr-FR')}</td>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{getVehiclePlate(inc.vehicle_id)}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{inc.incident_type}</td>
                  <td className={`px-6 py-4 max-w-xs truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} title={inc.description}>{inc.description}</td>
                  <td className={`px-6 py-4 font-semibold text-red-600`}>{inc.cost ? fmt(inc.cost) + ' DA' : '-'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(inc.status)}`}>{inc.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* ✅ NOUVEAU BOUTON PDF AJOUTÉ ICI */}
                      <button 
                        onClick={() => handleDownloadPDF(inc.id)} 
                        className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-50 rounded" 
                        title="Rapport PDF"
                      >
                        <FileText size={18} />
                      </button>
                      <button onClick={() => handleEdit(inc)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded" title="Modifier">
                        <Edit size={18} />
                      </button>
                      <button onClick={async () => { if(confirm('Supprimer cet incident ?')) { await deleteIncident(inc.id); loadData(); } }} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded" title="Supprimer">
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