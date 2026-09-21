import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Camera, X, CheckCircle } from 'lucide-react';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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

  const startScan = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScan();
          setMessage(`Véhicule scanné : ${decodedText}`);
          if (decodedText.includes('/vehicles/')) {
            const id = decodedText.split('/vehicles/')[1];
            setTimeout(() => navigate(`/vehicles`), 1500);
          }
        },
        (error) => {
          // Ignorer les erreurs de scan en continu
        }
      );
      setScanning(true);
    } catch (err) {
      setMessage("Erreur d'accès à la caméra. Vérifiez les permissions.");
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => { stopScan(); };
  }, []);

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'}`}>
      <h1 className={`text-3xl font-bold text-gray-800 dark:text-white mb-6`}> Scanner QR Code</h1>
      
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md max-w-2xl mx-auto`}>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Scannez le QR code d'un véhicule pour accéder directement à sa fiche.
        </p>
        
        {!scanning ? (
          <button
            onClick={startScan}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-lg transition"
          >
            <Camera size={24} /> Démarrer le scan
          </button>
        ) : (
          <div>
            <div id="qr-reader" className="w-full"></div>
            <button
              onClick={stopScan}
              className="mt-4 w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition"
            >
              <X size={20} /> Arrêter le scan
            </button>
          </div>
        )}
        
        {message && (
          <div className={`mt-4 p-4 ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'} rounded-lg flex items-center gap-2`}>
            <CheckCircle size={20} />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}