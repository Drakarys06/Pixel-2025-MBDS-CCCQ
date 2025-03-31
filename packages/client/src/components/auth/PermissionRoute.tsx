import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface PermissionRouteProps {
	children: React.ReactNode;
	permission: string;
	redirectTo?: string;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({
	children,
	permission,
	redirectTo = '/unauthorized'
}) => {
	const { isLoggedIn, hasPermission, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return <div className="loading-spinner">Chargement...</div>;
	}

	if (!isLoggedIn) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (!hasPermission(permission)) {
		return <Navigate to={redirectTo} state={{ from: location, requiredPermission: permission }} replace />;
	}

	return <>{children}</>;
};

export default PermissionRoute;