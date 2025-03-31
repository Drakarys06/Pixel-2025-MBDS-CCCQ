import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const AuthNavStatus: React.FC = () => {
	const { isLoggedIn, currentUser, isGuestMode, logout } = useAuth();

	const handleLogout = () => {
		logout();
	};

	return (
		<div className="nav-auth">
			{isLoggedIn ? (
				// Utilisateur connecté (normal ou invité)
				<div className="auth-user-info">
					{isGuestMode ? (
						// Mode invité
						<span className="guest-label">{currentUser?.username || 'Visiteur'}</span>
					) : (
						// Utilisateur normal
						<Link to="/profile" className="user-profile-link">
							<span className="username">{currentUser?.username}</span>
						</Link>
					)}
					<button className="btn-logout" onClick={handleLogout}>
						Déconnexion
					</button>
				</div>
			) : (
				// Utilisateur non connecté
				<>
					<Link to="/login" className="btn-login">Connexion</Link>
					<Link to="/signup" className="btn-signup">Inscription</Link>
				</>
			)}
		</div>
	);
};

export default AuthNavStatus;