import { useEffect, useState, useRef } from 'react';
import { getNotifications } from '../services/api';
import { Bell, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement notifications", error);
    }
  };

  const urgentCount = notifications.filter(n => n.type === 'urgence').length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full transition"
      >
        <Bell size={22} />
        {urgentCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
            {urgentCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
            <span className="text-xs text-gray-500">{notifications.length} alerte(s)</span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                <p className="text-sm">Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div 
                  key={index} 
                  className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    notif.type === 'urgence' ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notif.type === 'urgence' ? (
                      <AlertTriangle className="text-red-600 mt-1 flex-shrink-0" size={18} />
                    ) : (
                      <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={18} />
                    )}
                    <div>
                      <p className={`text-sm ${notif.type === 'urgence' ? 'text-red-800 dark:text-red-200 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}