import { Link, useLocation } from 'react-router-dom';
import { Car, Wrench, Fuel, DollarSign, BarChart3, AlertTriangle, Disc } from 'lucide-react';
import { Calendar } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/vehicles', icon: Car, label: 'Véhicules' },
    { path: '/maintenances', icon: Wrench, label: 'Entretiens' },
    { path: '/fuels', icon: Fuel, label: 'Carburant' },
    { path: '/expenses', icon: DollarSign, label: 'Dépenses' },
    { path: '/tires', icon: Disc, label: 'Pneus' }, // NOUVEAU
    { path: '/alerts', icon: AlertTriangle, label: 'Alertes' },
    { path: '/reminders', icon: Calendar, label: 'Rappels' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600"> FleetManager</h1>
          <p className="text-xs text-gray-500 mt-1">Gestion de flotte Pro</p>
        </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}