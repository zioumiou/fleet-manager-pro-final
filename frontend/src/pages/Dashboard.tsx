import { useEffect, useState } from 'react';
import { 
  getVehicles, 
  getFuels, 
  getMaintenances, 
  getExpenses,
  getDashboardAlerts
} from '../services/api';
import { Vehicle, Fuel, Maintenance, Expense } from '../types';
import { 
  Car, 
  Fuel as FuelIcon, 
  Wrench, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity,
  Calendar,
  Gauge
} from 'lucide-react';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Détection initiale du thème
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Observer les changements de thème en temps réel
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    loadData();
    loadPrediction();

    return () => observer.disconnect();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehRes, fuelRes, maintRes, expRes, alertsRes] = await Promise.all([
        getVehicles(),
        getFuels(),
        getMaintenances(),
        getExpenses(),
        getDashboardAlerts().catch(() => ({ data: [] }))
      ]);
      
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
      setFuels(Array.isArray(fuelRes.data) ? fuelRes.data : []);
      setMaintenances(Array.isArray(maintRes.data) ? maintRes.data : []);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
    } catch (error) {
      console.error("Erreur chargement dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrediction = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/analytics/predict-fuel', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (error) {
      console.error("Erreur chargement prédiction IA", error);
    }
  };

  // Calculs KPIs
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'Actif').length;
  
  const currentYear = new Date().getFullYear();
  const fuelsThisYear = fuels.filter(f => new Date(f.fuel_date).getFullYear() === currentYear);
  const totalFuelCost = fuelsThisYear.reduce((sum, f) => sum + (f.total_cost || 0), 0);
  const totalLiters = fuelsThisYear.reduce((sum, f) => sum + (f.liters || 0), 0);
  
  const maintThisYear = maintenances.filter(m => new Date(m.maintenance_date).getFullYear() === currentYear);
  const totalMaintCost = maintThisYear.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  const expThisYear = expenses.filter(e => new Date(e.expense_date).getFullYear() === currentYear);
  const totalExpCost = expThisYear.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalCost = totalFuelCost + totalMaintCost + totalExpCost;
  
  // Consommation moyenne (L/100km) - estimation basée sur les pleins
  const avgConsumption = totalLiters > 0 && fuelsThisYear.length > 1 
    ? (totalLiters / fuelsThisYear.length).toFixed(2) 
    : '0';

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      {/* En-tête */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Tableau de Bord
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Vue d'ensemble de votre flotte • Année {currentYear}
        </p>
      </div>

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Véhicules */}
        <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Car className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              activeVehicles === totalVehicles 
                ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                : (isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
            }`}>
              {activeVehicles}/{totalVehicles} actifs
            </span>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalVehicles}</p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Véhicules enregistrés</p>
        </div>

        {/* Carburant */}
        <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
              <FuelIcon className={isDarkMode ? 'text-orange-400' : 'text-orange-600'} size={24} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fmt(totalFuelCost)}</p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>DA de carburant ({currentYear})</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {totalLiters.toFixed(0)} L • {fuelsThisYear.length} pleins
          </p>
        </div>

        {/* Entretien */}
        <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <Wrench className={isDarkMode ? 'text-green-400' : 'text-green-600'} size={24} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fmt(totalMaintCost)}</p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>DA d'entretien ({currentYear})</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {maintThisYear.length} interventions
          </p>
        </div>

        {/* Total Dépenses */}
        <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <DollarSign className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={24} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{fmt(totalCost)}</p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>DA total ({currentYear})</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Carburant + Entretien + Autres
          </p>
        </div>
      </div>

      {/* KPIs Secondaires + Prédiction IA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Consommation moyenne */}
        <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Consommation Moyenne
            </h3>
            <Gauge className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {avgConsumption} <span className="text-sm font-normal">L/plein</span>
          </p>
        </div>

        {/* Coût moyen par véhicule */}
        <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Coût Moyen / Véhicule
            </h3>
            <Activity className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {totalVehicles > 0 ? fmt(totalCost / totalVehicles) : '0.00'} <span className="text-sm font-normal">DA</span>
          </p>
        </div>

        {/* Prédiction IA (Lot 5) */}
        {prediction && (
          <div className={`p-6 rounded-xl shadow-sm border transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Prédiction Carburant (IA)
              </h3>
              <span className="text-2xl">🤖</span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {fmt(prediction.prediction)} <span className="text-sm font-normal">DA</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              {prediction.trend === 'increasing' ? (
                <>
                  <TrendingUp className="text-red-500" size={16} />
                  <span className="text-xs text-red-500 font-medium">Tendance +5%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="text-green-500" size={16} />
                  <span className="text-xs text-green-500 font-medium">Stable</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alertes récentes */}
      {alerts.length > 0 && (
        <div className={`p-6 rounded-xl shadow-sm border mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="text-orange-500" size={20} />
            Alertes récentes
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg flex items-start gap-3 ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {alert.message || alert.description || 'Alerte système'}
                  </p>
                  {alert.date && (
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(alert.date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Derniers pleins */}
        <div className={`p-6 rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <FuelIcon className="text-orange-500" size={20} />
            Derniers pleins
          </h2>
          {fuels.length === 0 ? (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Aucun plein enregistré
            </p>
          ) : (
            <div className="space-y-2">
              {fuels.slice(-5).reverse().map((fuel, idx) => {
                const vehicle = vehicles.find(v => v.id === fuel.vehicle_id);
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                        <FuelIcon size={16} className={isDarkMode ? 'text-orange-400' : 'text-orange-600'} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {vehicle?.license_plate || 'N/A'}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {fuel.fuel_date ? new Date(fuel.fuel_date).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {fmt(fuel.total_cost || 0)} DA
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {fuel.liters?.toFixed(1) || 0} L
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Derniers entretiens */}
        <div className={`p-6 rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Wrench className="text-green-500" size={20} />
            Derniers entretiens
          </h2>
          {maintenances.length === 0 ? (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Aucun entretien enregistré
            </p>
          ) : (
            <div className="space-y-2">
              {maintenances.slice(-5).reverse().map((maint, idx) => {
                const vehicle = vehicles.find(v => v.id === maint.vehicle_id);
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                        <Wrench size={16} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {maint.maintenance_type || 'Entretien'}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {vehicle?.license_plate || 'N/A'} • {maint.maintenance_date ? new Date(maint.maintenance_date).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {fmt(maint.cost || 0)} DA
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer avec date */}
      <div className={`mt-6 text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <Calendar size={12} className="inline mr-1" />
        Dernière mise à jour : {new Date().toLocaleString('fr-FR')} • FleetManager Pro v2.5
      </div>
    </div>
  );
}