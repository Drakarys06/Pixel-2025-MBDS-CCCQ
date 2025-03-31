import React from 'react';
import { useAuth } from './AuthContext';

interface PermissionGateProps {
	permission?: string;
	role?: string;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

/**
 * Affiche du contenu en fonction des permissions ou rôles de l'utilisateur.
 * 
 * @param permission - Permission requise
 * @param role - Rôle requis
 * @param children - Contenu à afficher si l'accès est accordé
 * @param fallback - Contenu à afficher si l'accès est refusé
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