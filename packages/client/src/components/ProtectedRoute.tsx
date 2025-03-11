import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Vous pouvez remplacer ceci par un composant de chargement plus joli
    return <div className="loading">Chargement...</div>;
  }

  if (!isLoggedIn) {
    // Rediriger vers la page de login et sauvegarder l'emplacement actuel
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;