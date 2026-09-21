import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Vérifie si un token existe dans le stockage local
  const token = localStorage.getItem('token');

  // Si pas de token, on redirige vers la page de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si le token existe, on affiche la page demandée
  return <Outlet />;
}