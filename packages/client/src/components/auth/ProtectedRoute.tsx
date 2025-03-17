import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Composant qui protège les routes nécessitant une authentification
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }

  // Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion
  // en stockant l'URL actuelle pour y revenir après la connexion
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;