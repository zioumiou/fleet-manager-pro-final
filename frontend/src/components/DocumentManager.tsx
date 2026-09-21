import { useState, useEffect } from 'react';
import { uploadDocument, getVehicleDocuments, deleteDocument } from '../services/api';
import { Document } from '../types';
import { Upload, Trash2, FileText, X } from 'lucide-react';

interface DocumentManagerProps {
  vehicleId: number;
  vehicleName: string;
  onClose: () => void;
}

export default function DocumentManager({ vehicleId, vehicleName, onClose }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('Carte Grise');

  useEffect(() => {
    loadDocuments();
  }, [vehicleId]);

  const loadDocuments = async () => {
    try {
      const res = await getVehicleDocuments(vehicleId);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement documents", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      await uploadDocument(vehicleId, documentType, selectedFile);
      setSelectedFile(null);
      // Réinitialiser l'input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadDocuments();
    } catch (error) {
      console.error("Erreur upload", error);
      alert("Erreur lors de l'upload du document");
    }
    setUploading(false);
  };

  const handleDelete = async (docId: number) => {
    if (confirm('Supprimer ce document ?')) {
      try {
        await deleteDocument(docId);
        loadDocuments();
      } catch (error) {
        console.error("Erreur suppression", error);
      }
    }
  };

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Carte Grise': '📄',
      'Assurance': '🛡️',
      'Visite Technique': '🔍',
      'Facture': '🧾',
      'Permis': '🪪',
      'Autre': '📎'
    };
    return icons[type] || '📎';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            📎 Documents - {vehicleName}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Zone d'upload */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter un document</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="Carte Grise">Carte Grise</option>
              <option value="Assurance">Assurance</option>
              <option value="Visite Technique">Visite Technique</option>
              <option value="Facture">Facture</option>
              <option value="Permis">Permis</option>
              <option value="Autre">Autre</option>
            </select>
            
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              <Upload size={18} />
              {uploading ? 'Upload...' : 'Uploader'}
            </button>
          </div>
        </div>

        {/* Liste des documents */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Documents existants ({documents.length})
          </h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-2 opacity-50" />
              <p>Aucun document pour ce véhicule</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getDocumentIcon(doc.document_type)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.document_type} • Ajouté le {new Date(doc.upload_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}