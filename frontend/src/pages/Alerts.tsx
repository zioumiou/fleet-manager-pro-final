import { useEffect, useState } from 'react';
import { getAlerts } from '../services/api';
import { Alert } from '../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const res = await getAlerts();
    setAlerts(Array.isArray(res.data) ? res.data : []);
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Alertes d'Entretien</h1>

      {alerts.length === 0 ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={32} />
            <div>
              <h2 className="text-xl font-bold text-green-700">Aucune alerte</h2>
              <p className="text-green-600">Tous les entretiens sont à jour !</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {criticalAlerts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={24} />
                {criticalAlerts.length} Alerte(s) Critique(s)
              </h2>
              <div className="space-y-3">
                {criticalAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{alert.license_plate}</p>
                        <p className="text-gray-700">{alert.item_name}</p>
                      </div>
                      <div className="text-right">
                        {alert.alert_type === 'km' && alert.km_remaining !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-red-600">{alert.km_remaining} km</p>
                            <p className="text-sm text-gray-600">restants</p>
                          </div>
                        )}
                        {alert.alert_type === 'date' && alert.days_remaining !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-red-600">{alert.days_remaining} jour(s)</p>
                            <p className="text-sm text-gray-600">restants</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={24} />
                {warningAlerts.length} Alerte(s) à Surveiller
              </h2>
              <div className="space-y-3">
                {warningAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{alert.license_plate}</p>
                        <p className="text-gray-700">{alert.item_name}</p>
                      </div>
                      <div className="text-right">
                        {alert.alert_type === 'km' && alert.km_remaining !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-orange-600">{alert.km_remaining} km</p>
                            <p className="text-sm text-gray-600">restants</p>
                          </div>
                        )}
                        {alert.alert_type === 'date' && alert.days_remaining !== undefined && (
                          <div>
                            <p className="text-2xl font-bold text-orange-600">{alert.days_remaining} jour(s)</p>
                            <p className="text-sm text-gray-600">restants</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}