import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Car, Wrench, Fuel, DollarSign, 
  Disc, Bell, BarChart3, CreditCard, Users, Moon, Sun, 
  PiggyBank, AlertTriangle, QrCode, LogOut, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
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
import QRScanner from './pages/QRScanner';
import Documents from './pages/Documents';
import NotificationCenter from './components/NotificationCenter';

// Composant pour protéger les routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function Sidebar({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const isActive = (path: string) => 
    location.pathname === path 
      ? (isDarkMode ? 'bg-gray-700 text-blue-400 font-semibold' : 'bg-blue-100 text-blue-700 font-semibold') 
      : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100');

  return (
    <div className={`w-64 h-screen border-r flex flex-col fixed left-0 top-0 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
      <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <h1 className="text-2xl font-bold text-blue-500">FleetManager</h1>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pro v2.4</p>
        </div>
        <button onClick={toggleTheme} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
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
        <Link to="/alerts" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/alerts')}`}>
          <Bell size={20} /> Alertes
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
        </div>

        <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`px-4 text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Outils</p>
          <Link to="/qr-scanner" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/qr-scanner')}`}>
            <QrCode size={20} /> Scanner QR
          </Link>
        </div>
      </nav>

      {/* Section utilisateur en bas */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.full_name || 'Utilisateur'}
            </p>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email || ''}
            </p>
          </div>
          <button 
            onClick={logout} 
            className="ml-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = document.documentElement.classList.contains('dark');
    setIsDarkMode(darkMode);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Barre supérieure avec la cloche de notifications */}
        <div className="flex justify-end mb-6">
          <NotificationCenter />
        </div>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
          <Route path="/drivers" element={<PrivateRoute><Drivers /></PrivateRoute>} />
          <Route path="/maintenances" element={<PrivateRoute><Maintenances /></PrivateRoute>} />
          <Route path="/fuels" element={<PrivateRoute><Fuels /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/tires" element={<PrivateRoute><Tires /></PrivateRoute>} />
          <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
          <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
          <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
          <Route path="/budgets" element={<PrivateRoute><Budgets /></PrivateRoute>} />
          <Route path="/incidents" element={<PrivateRoute><Incidents /></PrivateRoute>} />
          <Route path="/naftal" element={<PrivateRoute><NaftalCards /></PrivateRoute>} />
          <Route path="/qr-scanner" element={<PrivateRoute><QRScanner /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}