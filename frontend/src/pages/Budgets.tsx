import { useEffect, useState } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getVehicles } from '../services/api';
import { Budget, Vehicle } from '../types';
import { Plus, Trash2, Edit, PiggyBank } from 'lucide-react';

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: 0,
    category: 'Global',
    amount: 0,
    period: 'Mensuel',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    is_active: true
  });

  useEffect(() => { 
    loadData();
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
      const [budgetRes, vehRes] = await Promise.all([getBudgets(), getVehicles()]);
      setBudgets(Array.isArray(budgetRes.data) ? budgetRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) { console.error("Erreur chargement budgets", error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        vehicle_id: formData.vehicle_id === 0 ? null : formData.vehicle_id, 
        amount: parseFloat(String(formData.amount)) 
      };
      if (editingId) await updateBudget(editingId, payload);
      else await createBudget(payload);
      setShowForm(false); setEditingId(null);
      setFormData({ vehicle_id: 0, category: 'Global', amount: 0, period: 'Mensuel', start_date: new Date().toISOString().split('T')[0], end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], is_active: true });
      loadData();
    } catch (error: any) { alert(error.response?.data?.detail || "Erreur"); }
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setFormData({ 
      vehicle_id: budget.vehicle_id || 0, 
      category: budget.category, 
      amount: budget.amount, 
      period: budget.period, 
      start_date: budget.start_date, 
      end_date: budget.end_date, 
      is_active: budget.is_active 
    });
    setShowForm(true);
  };

  const getVehiclePlate = (id: number | null) => 
    id ? (vehicles.find(v => v.id === id)?.license_plate || 'Inconnu') : 'Global (Tous les véhicules)';
  
  const fmt = (n: number) => 
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            💰 Gestion des Budgets
          </h1>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Nouveau Budget
        </button>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingId ? 'Modifier' : 'Nouveau Budget'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Véhicule (0 = Global)
              </label>
              <select 
                value={formData.vehicle_id} 
                onChange={(e) => setFormData({...formData, vehicle_id: parseInt(e.target.value)})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value={0}>Global (Tous les véhicules)</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Catégorie
              </label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="Global">Global</option>
                <option value="Carburant">Carburant</option>
                <option value="Entretien">Entretien</option>
                <option value="Assurance">Assurance</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Période
              </label>
              <select 
                value={formData.period} 
                onChange={(e) => setFormData({...formData, period: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="Mensuel">Mensuel</option>
                <option value="Annuel">Annuel</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Montant (DA) *
              </label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date début *
              </label>
              <input 
                type="date" 
                required 
                value={formData.start_date} 
                onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date fin *
              </label>
              <input 
                type="date" 
                required 
                value={formData.end_date} 
                onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
              />
            </div>
            <div className="flex gap-2 items-end md:col-span-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex-1">
                Enregistrer
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(budget => (
          <div 
            key={budget.id} 
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow border-l-4 ${budget.is_active ? 'border-green-500' : 'border-gray-400'} transition`}
          >
            <div className="flex justify-between items-start mb-3">
              <PiggyBank size={32} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <span className={`px-2 py-1 rounded text-xs ${
                budget.is_active 
                  ? (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                  : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
              }`}>
                {budget.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {budget.category}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
              🚗 {getVehiclePlate(budget.vehicle_id)}
            </p>
            <p className={`text-2xl font-bold text-blue-600 mb-1`}>
              {fmt(budget.amount)} DA
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-3`}>
              Période: {budget.period}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
              Du {new Date(budget.start_date).toLocaleDateString('fr-FR')} au {new Date(budget.end_date).toLocaleDateString('fr-FR')}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleEdit(budget)} 
                className="flex-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1 transition"
              >
                <Edit size={14} /> Modifier
              </button>
              <button 
                onClick={async () => { if(confirm('Supprimer ce budget ?')) { await deleteBudget(budget.id); loadData(); } }} 
                className="text-red-600 dark:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
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