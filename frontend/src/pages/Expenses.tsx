import { useEffect, useState } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getVehicles } from '../services/api';
import { Expense, Vehicle } from '../types';
import { Plus, Trash2, Edit, DollarSign } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: 0,
    category_id: 1,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0
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
      const [expRes, vehRes] = await Promise.all([getExpenses(), getVehicles()]);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) { console.error("Erreur chargement dépenses", error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vehicle_id: parseInt(String(formData.vehicle_id)),
        category_id: parseInt(String(formData.category_id)) || 1,
        amount: parseFloat(String(formData.amount)) || 0
      };
      if (editingId) await updateExpense(editingId, payload);
      else await createExpense(payload);
      setShowForm(false); setEditingId(null);
      setFormData({ vehicle_id: 0, category_id: 1, expense_date: new Date().toISOString().split('T')[0], description: '', amount: 0 });
      loadData();
    } catch (error: any) { alert(error.response?.data?.detail || "Erreur"); }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      vehicle_id: expense.vehicle_id,
      category_id: expense.category_id || 1,
      expense_date: expense.expense_date,
      description: expense.description || '',
      amount: expense.amount || 0
    });
    setShowForm(true);
  };

  const getVehiclePlate = (id: number) => vehicles.find(v => v.id === id)?.license_plate || 'Inconnu';
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>💲 Dépenses</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{editingId ? 'Modifier' : 'Nouvelle Dépense'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Véhicule *</label>
              <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: parseInt(e.target.value)})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value={0}>Sélectionner</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Catégorie *</label>
              <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                <option value={1}>Carburant</option>
                <option value={2}>Entretien</option>
                <option value={3}>Assurance</option>
                <option value={4}>Péage</option>
                <option value={5}>Autre</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date *</label>
              <input type="date" required value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Montant (DA) *</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
              <input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
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
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Catégorie</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Montant</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune dépense enregistrée</td></tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition`}>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(exp.expense_date).toLocaleDateString('fr-FR')}</td>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getVehiclePlate(exp.vehicle_id)}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Catégorie {exp.category_id}</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{exp.description || '-'}</td>
                  <td className={`px-6 py-4 font-semibold text-red-600`}>{fmt(exp.amount || 0)} DA</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(exp)} className="text-blue-500 hover:text-blue-400 p-1 hover:bg-blue-500/10 rounded transition"><Edit size={18} /></button>
                      <button onClick={async () => { if(confirm('Supprimer cette dépense ?')) { await deleteExpense(exp.id); loadData(); } }} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition"><Trash2 size={18} /></button>
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