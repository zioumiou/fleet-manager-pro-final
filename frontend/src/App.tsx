import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Wrench, Fuel, DollarSign,
  Disc, Bell, BarChart3, CreditCard, Users, Moon, Sun,
  PiggyBank, AlertTriangle, FileText, QrCode
} from 'lucide-react';
import { useState } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Maintenances from './pages/Maintenances';
import Fuels from './pages/Fuels';
import Expenses from './pages/Expenses';
import Tires from './pages/Tires';
import Reminders from './pages/Reminders';
import Alerts from './pages/Alerts';
import Statistics from './pages/Statistics';
import NaftalCards from './pages/NaftalCards';
import Budgets from './pages/Budgets';
import Incidents from './pages/Incidents';
import Documents from './pages/Documents';
import QRScanner from './pages/QRScanner';

// Authentification et Protection
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ==========================================
// COMPOSANT SIDEBAR
// ==========================================
function Sidebar({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path
      ? (isDarkMode ? 'bg-gray-700 text-blue-400 font-semibold' : 'bg-blue-100 text-blue-700 font-semibold')
      : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100');

  return (
    <div className={`w-64 h-screen border-r flex flex-col fixed left-0 top-0 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
      <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <h1 className="text-2xl font-bold text-blue-500">FleetManager</h1>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pro v2.5 Final</p>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/')}`}>
          <LayoutDashboard size={20} /> Tableau de Bord
        </Link>
        <Link to="/vehicles" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/vehicles')}`}>
          <Car size={20} /> Véhicules
        </Link>
        <Link to="/drivers" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/drivers')}`}>
          <Users size={20} /> Conducteurs
        </Link>
        <Link to="/maintenances" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/maintenances')}`}>
          <Wrench size={20} /> Entretiens
        </Link>
        <Link to="/fuels" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/fuels')}`}>
          <Fuel size={20} /> Carburant
        </Link>
        <Link to="/expenses" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/expenses')}`}>
          <DollarSign size={20} /> Dépenses
        </Link>
        <Link to="/tires" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/tires')}`}>
          <Disc size={20} /> Pneus
        </Link>
        <Link to="/reminders" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/reminders')}`}>
          <Bell size={20} /> Rappels
        </Link>
        <Link to="/documents" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/documents')}`}>
          <FileText size={20} /> Documents
        </Link>
        
        <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`px-4 text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Analyses & Finance</p>
          <Link to="/statistics" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/statistics')}`}>
            <BarChart3 size={20} /> Statistiques
          </Link>
          <Link to="/budgets" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/budgets')}`}>
            <PiggyBank size={20} /> Budgets
          </Link>
          <Link to="/incidents" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/incidents')}`}>
            <AlertTriangle size={20} /> Incidents
          </Link>
          <Link to="/naftal" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/naftal')}`}>
            <CreditCard size={20} /> Naftal Cards
          </Link>
          <Link to="/qr-scanner" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/qr-scanner')}`}>
            <QrCode size={20} /> Scanner QR
          </Link>
        </div>
      </nav>
    </div>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL APP
// ==========================================
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
          <Sidebar isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
          <main className="flex-1 ml-64 p-8 overflow-y-auto">
            <Routes>
              {/* Route publique (Login) */}
              <Route path="/login" element={<Login />} />

              {/* Routes protégées (nécessitent un token) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/maintenances" element={<Maintenances />} />
                <Route path="/fuels" element={<Fuels />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/tires" element={<Tires />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/naftal" element={<NaftalCards />} />
                <Route path="/qr-scanner" element={<QRScanner />} />
                
                {/* Redirection par défaut si l'URL n'existe pas */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}