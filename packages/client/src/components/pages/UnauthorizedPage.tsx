import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../layout/Layout';
import Button from '../ui/Button';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/UnauthorizedPage.css';

const UnauthorizedPage: React.FC = () => {
	const { isLoggedIn, isGuestMode } = useAuth();
	const location = useLocation();

	// Récupérer les informations sur les permissions/rôles requis depuis l'état de navigation
	const { requiredPermission, requiredRoles, from } = location.state || {};

	// Message adapté selon le contexte
	const getMessage = () => {
		if (isGuestMode) {
			return "As a guest user, you have limited access. Please create an account to access more features.";
		}

		if (isLoggedIn) {
			return "You don't have the necessary permissions to access this page.";
		}

		return "This page requires authentication. Please log in to continue.";
	};

	return (
		<Layout>
			<div className="unauthorized-container">
				<div className="unauthorized-content">
					<h1 className="unauthorized-title">Access Denied</h1>

					<div className="unauthorized-icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">
							<path fill="none" d="M0 0h24v24H0z" />
							<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"
								fill="currentColor" />
						</svg>
					</div>

					<p className="unauthorized-message">{getMessage()}</p>

					{requiredPermission && (
						<p className="permission-info">Required permission: <code>{requiredPermission}</code></p>
					)}

					{requiredRoles && (
						<p className="permission-info">
							Required role(s): <code>{Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}</code>
						</p>
					)}

					<div className="unauthorized-actions">
						{!isLoggedIn ? (
							<Link to="/login" state={{ from: from || location }}>
								<Button variant="primary">Log In</Button>
							</Link>
						) : isGuestMode ? (
							<Link to="/signup">
								<Button variant="primary">Create Account</Button>
							</Link>
						) : (
							<Link to="/">
								<Button variant="primary">Go to Home</Button>
							</Link>
						)}

						{from && (
							<Link to={from}>
								<Button variant="secondary">Go Back</Button>
							</Link>
						)}
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default UnauthorizedPage;