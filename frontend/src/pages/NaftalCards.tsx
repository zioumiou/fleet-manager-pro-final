import { useEffect, useState } from 'react';
import { getNaftalCards, createNaftalCard, updateNaftalCard, deleteNaftalCard, getNaftalTransactions, createNaftalTransaction, getVehicles } from '../services/api';
import { NaftalCard, NaftalTransaction, Vehicle } from '../types';
import { Plus, Trash2, Edit, CreditCard, ArrowDownCircle } from 'lucide-react';

export default function NaftalCards() {
  const [cards, setCards] = useState<NaftalCard[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transactions, setTransactions] = useState<NaftalTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<NaftalCard | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    card_number: '',
    vehicle_id: 0,
    monthly_limit: 0,
    current_balance: 0,
    expiration_date: ''
  });
  
  const [transactionData, setTransactionData] = useState({
    card_id: 0,
    amount: 0,
    liters: 0,
    station: '',
    mileage: 0
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cardRes, vehRes] = await Promise.all([getNaftalCards(), getVehicles()]);
      setCards(Array.isArray(cardRes.data) ? cardRes.data : []);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
    } catch (error) {
      console.error("Erreur chargement cartes Naftal", error);
    }
  };

  const loadTransactions = async (cardId: number) => {
    try {
      const res = await getNaftalTransactions(cardId);
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement transactions", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vehicle_id: parseInt(String(formData.vehicle_id)),
        monthly_limit: parseFloat(String(formData.monthly_limit)),
        current_balance: parseFloat(String(formData.current_balance))
      };
      if (editingId) {
        await updateNaftalCard(editingId, payload);
      } else {
        await createNaftalCard(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ card_number: '', vehicle_id: 0, monthly_limit: 0, current_balance: 0, expiration_date: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erreur");
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNaftalTransaction({
        ...transactionData,
        card_id: selectedCard?.id || 0,
        amount: parseFloat(String(transactionData.amount)),
        liters: parseFloat(String(transactionData.liters)) || 0,
        mileage: parseInt(String(transactionData.mileage)) || 0
      });
      setShowTransactionForm(false);
      setTransactionData({ card_id: 0, amount: 0, liters: 0, station: '', mileage: 0 });
      if (selectedCard) loadTransactions(selectedCard.id);
      loadData();
      alert('Transaction enregistrée avec succès !');
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erreur transaction");
    }
  };

  const getVehiclePlate = (id: number) => vehicles.find(v => v.id === id)?.license_plate || 'N/A';

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">💳 Naftal Cards</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Nouvelle Carte
        </button>
      </div>

      {/* Formulaire Carte */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Modifier' : 'Nouvelle Carte Naftal'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de carte *</label>
              <input required value={formData.card_number} onChange={(e) => setFormData({...formData, card_number: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Ex: 6280 1234 5678" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Véhicule *</label>
              <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 bg-white">
                <option value={0}>Sélectionner</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plafond mensuel (DA)</label>
              <input type="number" step="0.01" value={formData.monthly_limit} onChange={(e) => setFormData({...formData, monthly_limit: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Solde actuel (DA)</label>
              <input type="number" step="0.01" value={formData.current_balance} onChange={(e) => setFormData({...formData, current_balance: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date d'expiration</label>
              <input type="date" value={formData.expiration_date} onChange={(e) => setFormData({...formData, expiration_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex gap-2 items-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Enregistrer</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-6 py-2 rounded-lg">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.id} className={`bg-white p-6 rounded-lg shadow border-l-4 ${card.is_active ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start mb-3">
              <CreditCard size={32} className="text-blue-600" />
              <span className={`px-2 py-1 rounded text-xs ${card.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {card.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-lg font-mono font-bold mb-2">{card.card_number}</p>
            <p className="text-sm text-gray-600 mb-1">🚗 {getVehiclePlate(card.vehicle_id)}</p>
            <p className="text-sm text-gray-600 mb-3">💰 Solde: <span className="font-bold text-green-600">{fmt(card.current_balance)} DA</span></p>
            <p className="text-xs text-gray-500 mb-3">Plafond: {fmt(card.monthly_limit)} DA/mois</p>
            {card.expiration_date && (
              <p className="text-xs text-gray-500 mb-3">Expire: {new Date(card.expiration_date).toLocaleDateString('fr-FR')}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setSelectedCard(card); loadTransactions(card.id); setShowTransactionForm(true); }} className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1">
                <ArrowDownCircle size={14} /> Transaction
              </button>
              <button onClick={() => { setEditingId(card.id); setFormData({ card_number: card.card_number, vehicle_id: card.vehicle_id, monthly_limit: card.monthly_limit, current_balance: card.current_balance, expiration_date: card.expiration_date || '' }); setShowForm(true); }} className="text-blue-600 p-2 hover:bg-blue-50 rounded"><Edit size={16} /></button>
              <button onClick={async () => { if(confirm('Supprimer cette carte ?')) { await deleteNaftalCard(card.id); loadData(); } }} className="text-red-600 p-2 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire Transaction */}
      {showTransactionForm && selectedCard && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4">💸 Nouvelle Transaction - Carte {selectedCard.card_number}</h2>
          <form onSubmit={handleTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Montant (DA) *</label>
              <input type="number" step="0.01" required value={transactionData.amount} onChange={(e) => setTransactionData({...transactionData, amount: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Litres</label>
              <input type="number" step="0.01" value={transactionData.liters} onChange={(e) => setTransactionData({...transactionData, liters: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kilométrage</label>
              <input type="number" value={transactionData.mileage} onChange={(e) => setTransactionData({...transactionData, mileage: parseInt(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Station</label>
              <input type="text" value={transactionData.station} onChange={(e) => setTransactionData({...transactionData, station: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex gap-2 items-end">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Valider</button>
              <button type="button" onClick={() => setShowTransactionForm(false)} className="bg-gray-200 px-6 py-2 rounded-lg">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Historique des transactions */}
      {selectedCard && transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-lg font-semibold p-4 border-b"> Historique - Carte {selectedCard.card_number}</h3>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Litres</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(t.transaction_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 font-semibold text-red-600">{fmt(t.amount)} DA</td>
                  <td className="px-6 py-4">{t.liters?.toFixed(2) || '-'} L</td>
                  <td className="px-6 py-4">{t.station || '-'}</td>
                  <td className="px-6 py-4">{t.mileage?.toLocaleString() || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}