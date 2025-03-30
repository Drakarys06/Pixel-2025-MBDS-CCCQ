import React from 'react';
import { useAuth } from './AuthContext';

interface PermissionGateProps {
  permission?: string;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Un composant qui conditionne l'affichage de son contenu en fonction des permissions
 * ou des rôles de l'utilisateur.
 * 
 * @param permission - Permission requise (ex: "board:create")
 * @param role - Rôle requis (ex: "admin")
 * @param children - Contenu à afficher si l'utilisateur a la permission/le rôle
 * @param fallback - Contenu à afficher si l'utilisateur n'a pas la permission/le rôle (optionnel)
 */
const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  role, 
  children,
  fallback = null
}) => {
  const { hasPermission, hasRole } = useAuth();
  
  const hasAccess = 
    (permission && hasPermission(permission)) || 
    (role && hasRole(role));
  
  // Si aucun critère n'est spécifié, on autorise l'accès par défaut
  const shouldRender = (!permission && !role) || hasAccess;
  
  return <>{shouldRender ? children : fallback}</>;
};

export default PermissionGate;