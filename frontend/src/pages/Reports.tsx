import { useState } from 'react';
import { exportGlobalReportPDF, exportVehicleReportPDF, getVehicles } from '../services/api';
import { Vehicle } from '../types';
import { FileText, Download } from 'lucide-react';

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVehicles = async () => {
    const res = await getVehicles();
    setVehicles(res.data);
  };

  const handleGlobalPDF = async () => {
    setLoading(true);
    try {
      const res = await exportGlobalReportPDF();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rapport_global.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur export PDF", error);
    }
    setLoading(false);
  };

  const handleVehiclePDF = async (vehicleId: number) => {
    try {
      const res = await exportVehicleReportPDF(vehicleId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fiche_vehicule_${vehicleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur export PDF", error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Rapports & Exports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="text-blue-600" /> Rapport Global (PDF)
          </h2>
          <p className="text-gray-600 mb-4">Synthèse complète de la flotte avec les KPIs et la liste des véhicules.</p>
          <button 
            onClick={handleGlobalPDF}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Download size={20} /> {loading ? 'Génération...' : 'Télécharger le PDF'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="text-green-600" /> Fiches Individuelles (PDF)
          </h2>
          <p className="text-gray-600 mb-4">Fiche détaillée par véhicule avec historique d'entretien.</p>
          <button 
            onClick={loadVehicles}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mb-4 hover:bg-gray-300"
          >
            Charger la liste
          </button>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {vehicles.map(v => (
              <div key={v.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>{v.license_plate} - {v.brand} {v.model}</span>
                <button 
                  onClick={() => handleVehiclePDF(v.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}