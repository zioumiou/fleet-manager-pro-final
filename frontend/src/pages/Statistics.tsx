import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  getVehicles, getFuels, getMaintenances, getExpenses, 
  exportVehiclesCSV, exportVehiclesExcel, downloadFile 
} from '../services/api';
import { Vehicle, Fuel, Maintenance, Expense } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, DollarSign, Filter, FileSpreadsheet, FileText, Download 
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Statistics() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadData();
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const loadData = async () => {
    try {
      const [vehRes, fuelRes, maintRes, expRes] = await Promise.all([
        getVehicles(), getFuels(), getMaintenances(), getExpenses()
      ]);
      setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
      setFuels(Array.isArray(fuelRes.data) ? fuelRes.data : []);
      setMaintenances(Array.isArray(maintRes.data) ? maintRes.data : []);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
    } catch (error) {
      console.error("Erreur chargement statistiques", error);
    }
  };

  const filterByYear = (items: any[], dateField: string) => {
    return items.filter(item => {
      const date = item[dateField];
      return date && new Date(date).getFullYear() === selectedYear;
    });
  };

  const filterByVehicle = (items: any[]) => {
    if (!selectedVehicle) return items;
    return items.filter(item => item.vehicle_id === selectedVehicle);
  };

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(selectedYear, i).toLocaleDateString('fr-FR', { month: 'short' });
    const filteredFuels = filterByVehicle(filterByYear(fuels, 'fuel_date')).filter(f => new Date(f.fuel_date).getMonth() === i);
    const filteredMaint = filterByVehicle(filterByYear(maintenances, 'maintenance_date')).filter(m => new Date(m.maintenance_date).getMonth() === i);
    const filteredExpenses = filterByVehicle(filterByYear(expenses, 'expense_date')).filter(e => new Date(e.expense_date).getMonth() === i);
    
    return {
      month,
      Carburant: filteredFuels.reduce((sum, f) => sum + (f.total_cost || 0), 0),
      Entretien: filteredMaint.reduce((sum, m) => sum + (m.cost || 0), 0),
      Autres: filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      Total: filteredFuels.reduce((sum, f) => sum + (f.total_cost || 0), 0) + 
             filteredMaint.reduce((sum, m) => sum + (m.cost || 0), 0) + 
             filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    };
  });

  const mileageData = filterByVehicle(filterByYear(fuels, 'fuel_date'))
    .sort((a, b) => new Date(a.fuel_date).getTime() - new Date(b.fuel_date).getTime())
    .map(f => ({ date: new Date(f.fuel_date).toLocaleDateString('fr-FR'), km: f.mileage || 0 }));

  const categoryData = [
    { name: 'Carburant', value: filterByVehicle(filterByYear(fuels, 'fuel_date')).reduce((sum, f) => sum + (f.total_cost || 0), 0) },
    { name: 'Entretien', value: filterByVehicle(filterByYear(maintenances, 'maintenance_date')).reduce((sum, m) => sum + (m.cost || 0), 0) },
    { name: 'Autres', value: filterByVehicle(filterByYear(expenses, 'expense_date')).reduce((sum, e) => sum + (e.amount || 0), 0) }
  ].filter(c => c.value > 0);

  const exportReportXLSX = (type: 'global' | 'individual') => {
    const filteredFuels = filterByVehicle(filterByYear(fuels, 'fuel_date'));
    const filteredMaint = filterByVehicle(filterByYear(maintenances, 'maintenance_date'));
    const filteredExpenses = filterByVehicle(filterByYear(expenses, 'expense_date'));

    const totalFuel = filteredFuels.reduce((sum, f) => sum + (f.total_cost || 0), 0);
    const totalMaint = filteredMaint.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCost = totalFuel + totalMaint + totalExpenses;

    const wb = XLSX.utils.book_new();
    const summaryData: any[] = [
      [`RAPPORT ${type === 'global' ? 'GLOBAL' : 'INDIVIDUEL'} - FLEET MANAGER`],
      [`Année: ${selectedYear}`],
      type === 'individual' && selectedVehicle ? [`Véhicule: ${vehicles.find(v => v.id === selectedVehicle)?.license_plate || 'N/A'}`] : ['Tous les véhicules'],
      [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      ['RÉSUMÉ FINANCIER'],
      ['Carburant', totalFuel],
      ['Entretien', totalMaint],
      ['Autres dépenses', totalExpenses],
      ['TOTAL', totalCost],
      [],
      ['DÉTAILS PAR MOIS'],
      ['Mois', 'Carburant', 'Entretien', 'Autres', 'Total']
    ];

    monthlyData.forEach(m => {
      if (m.Total > 0) summaryData.push([m.month, m.Carburant, m.Entretien, m.Autres, m.Total]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Résumé');

    const fuelData: any[] = [['Date', 'Véhicule', 'Litres', 'Prix/Litre', 'Total', 'Station']];
    filteredFuels.forEach(f => {
      const vehicle = vehicles.find(v => v.id === f.vehicle_id);
      fuelData.push([new Date(f.fuel_date).toLocaleDateString('fr-FR'), vehicle?.license_plate || 'N/A', f.liters, f.price_per_liter, f.total_cost, f.station || '']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fuelData), 'Carburant');

    const maintData: any[] = [['Date', 'Véhicule', 'Type', 'Description', 'Coût', 'Garage']];
    filteredMaint.forEach(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      maintData.push([new Date(m.maintenance_date).toLocaleDateString('fr-FR'), vehicle?.license_plate || 'N/A', m.maintenance_type, m.description || '', m.cost, m.garage || '']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(maintData), 'Entretiens');

    const expData: any[] = [['Date', 'Véhicule', 'Description', 'Montant']];
    filteredExpenses.forEach(e => {
      const vehicle = vehicles.find(v => v.id === e.vehicle_id);
      expData.push([new Date(e.expense_date).toLocaleDateString('fr-FR'), vehicle?.license_plate || 'N/A', e.description, e.amount]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expData), 'Dépenses');

    XLSX.writeFile(wb, `Rapport_${type}_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDFGlobal = () => {
    window.open('http://localhost:8000/api/reports/financial/pdf', '_blank');
  };

  const handleExportPDFIndividual = () => {
    if (!selectedVehicle) {
      alert("Veuillez sélectionner un véhicule pour générer le rapport individuel");
      return;
    }
    window.open(`http://localhost:8000/api/reports/vehicle/${selectedVehicle}/pdf`, '_blank');
  };

  const fmtVal = (value: any) => [`${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA`, ''];

  return (
    <div className={`p-2 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📊 Statistiques & Rapports</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportPDFGlobal} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition">
            <FileText size={18} /> Rapport Financier PDF
          </button>
          <button 
            onClick={handleExportPDFIndividual} 
            disabled={!selectedVehicle}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText size={18} /> Fiche Véhicule PDF
          </button>
          <button onClick={() => exportReportXLSX('global')} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
            <FileSpreadsheet size={18} /> Rapport Global XLSX
          </button>
          <button 
            onClick={() => exportReportXLSX('individual')} 
            disabled={!selectedVehicle}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={18} /> Rapport Individuel XLSX
          </button>
        </div>
      </div>

      <div className={`flex gap-4 mb-6 p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-2">
          <Filter size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Année :</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
            className={`border rounded px-3 py-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Véhicule :</label>
          <select 
            value={selectedVehicle || ''} 
            onChange={(e) => setSelectedVehicle(e.target.value ? parseInt(e.target.value) : null)} 
            className={`border rounded px-3 py-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">Tous les véhicules</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
          </select>
        </div>
      </div>

      <div className={`p-6 rounded-lg shadow-sm mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <DollarSign className="text-blue-500" /> Dépenses Mensuelles ({selectedYear})
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
            <XAxis dataKey="month" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`, 
                color: isDarkMode ? '#f9fafb' : '#111827' 
              }} 
              formatter={fmtVal} 
            />
            <Legend wrapperStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }} />
            <Bar dataKey="Carburant" fill="#3B82F6" />
            <Bar dataKey="Entretien" fill="#10B981" />
            <Bar dataKey="Autres" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`p-6 rounded-lg shadow-sm mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <TrendingUp className="text-green-500" /> Évolution du Kilométrage ({selectedYear})
        </h2>
        {mileageData.length === 0 ? (
          <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Aucune donnée de kilométrage pour cette période
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={mileageData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`, 
                  color: isDarkMode ? '#f9fafb' : '#111827' 
                }} 
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }} />
              <Line type="monotone" dataKey="km" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <PieChart className="text-purple-500" /> Répartition des Dépenses par Catégorie
        </h2>
        {categoryData.length === 0 ? (
          <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Aucune donnée pour cette période
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie 
                data={categoryData} 
                cx="50%" 
                cy="50%" 
                outerRadius={120} 
                dataKey="value" 
                label={({ name, percent }: any) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
              >
                {categoryData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`, 
                  color: isDarkMode ? '#f9fafb' : '#111827' 
                }} 
                formatter={fmtVal} 
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}