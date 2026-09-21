import { useEffect, useState } from 'react';
import { getVehicles, getVehicleDocuments, uploadDocument, downloadDocument } from '../services/api';
import { Vehicle, Document } from '../types';
import { Upload, FileText, Download, Trash2, Car } from 'lucide-react';

export default function Documents() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Carte Grise');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadVehicles();
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

  useEffect(() => {
    if (selectedVehicleId) loadDocuments(selectedVehicleId);
  }, [selectedVehicleId]);

  const loadVehicles = async () => {
    try {
      const res = await getVehicles();
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error("Erreur chargement véhicules", error); }
  };

  const loadDocuments = async (vehicleId: number) => {
    try {
      const res = await getVehicleDocuments(vehicleId);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error("Erreur chargement documents", error); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedVehicleId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('vehicle_id', selectedVehicleId.toString());
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      await uploadDocument(formData);
      setFile(null);
      setDocType('Carte Grise');
      loadDocuments(selectedVehicleId);
      alert("Document uploadé avec succès !");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📂 Gestion des Documents</h1>

      <div className={`p-4 rounded-lg shadow-sm mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Sélectionner un véhicule pour voir ses documents :
        </label>
        <select 
          value={selectedVehicleId || ''} 
          onChange={(e) => setSelectedVehicleId(e.target.value ? parseInt(e.target.value) : null)}
          className={`w-full md:w-1/2 border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
        >
          <option value="">-- Choisir un véhicule --</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>
          ))}
        </select>
      </div>

      {selectedVehicleId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-lg shadow-sm h-fit ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Upload size={20} /> Nouveau Document
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type de document</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="Carte Grise">Carte Grise</option>
                  <option value="Assurance">Attestation d'Assurance</option>
                  <option value="Visite Technique">Visite Technique</option>
                  <option value="Permis Conducteur">Permis du Conducteur</option>
                  <option value="Facture Achat">Facture d'Achat</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fichier (PDF, JPG, PNG)</label>
                <input 
                  type="file" 
                  required 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
                  className={`w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <button 
                type="submit" 
                disabled={uploading || !file}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
              >
                {uploading ? 'Upload en cours...' : <><Upload size={18} /> Uploader</>}
              </button>
            </form>
          </div>

          <div className={`lg:col-span-2 p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <FileText size={20} /> Documents du véhicule
            </h2>
            
            {documents.length === 0 ? (
              <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Car size={48} className="mx-auto mb-3 opacity-50" />
                <p>Aucun document enregistré pour ce véhicule.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                        <FileText className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                      </div>
                      <div>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{doc.document_type}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {doc.file_name} • {formatSize(doc.file_size)} • {new Date(doc.upload_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => downloadDocument(doc.id)}
                      className={`p-2 rounded-lg transition ${isDarkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-blue-50'}`}
                      title="Télécharger"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}