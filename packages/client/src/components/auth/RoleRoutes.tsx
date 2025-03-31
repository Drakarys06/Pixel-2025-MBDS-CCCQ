import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface RoleRouteProps {
	children: React.ReactNode;
	role: string | string[];
	redirectTo?: string;
}

const RoleRoute: React.FC<RoleRouteProps> = ({
	children,
	role,
	redirectTo = '/unauthorized'
}) => {
	const { isLoggedIn, hasRole, loading } = useAuth();
	const location = useLocation();
	const roles = Array.isArray(role) ? role : [role];

	if (loading) {
		return <div className="loading-spinner">Chargement...</div>;
	}

	if (!isLoggedIn) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	const hasRequiredRole = roles.some(r => hasRole(r));

	if (!hasRequiredRole) {
		return <Navigate to={redirectTo} state={{ from: location, requiredRoles: roles }} replace />;
	}

	return <>{children}</>;
};

export default RoleRoute;