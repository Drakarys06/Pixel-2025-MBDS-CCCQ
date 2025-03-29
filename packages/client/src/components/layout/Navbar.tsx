import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';
import RoleBadge from '../ui/RoleBadge';
import { useAuth } from '../auth/AuthContext';
import usePermissions from '../auth/usePermissions';
import PermissionGate from '../auth/PermissionGate';
import { PERMISSIONS } from '../auth/permissions';
import '../../styles/layout/Navbar.css';

interface NavbarProps {
	logoText?: string;
}

const Navbar: React.FC<NavbarProps> = ({ logoText = 'PixelBoard' }) => {
	const { isLoggedIn, currentUser, logout } = useAuth();
	const permissions = usePermissions();

	const handleLogout = () => {
		logout();
		// La redirection est gérée dans la fonction logout
	};

	return (
		<header className="navbar">
			<nav className="navbar-content">
				<Link to="/" className="navbar-logo">
					{logoText}
				</Link>

				<div className="navbar-links">
					<NavLink to="/explore" className={({isActive}) =>
						isActive ? "navbar-link active" : "navbar-link"
					}>
						Explore
					</NavLink>

					{/* Conditionnellement afficher le lien Create si l'utilisateur a la permission */}
					<PermissionGate permission={PERMISSIONS.BOARD_CREATE}>
						<NavLink to="/create" className={({isActive}) =>
							isActive ? "navbar-link active" : "navbar-link"
						}>
							Create
						</NavLink>
					</PermissionGate>

					{/* Lien My Boards toujours visible pour les utilisateurs connectés */}
					{isLoggedIn && (
						<NavLink to="/boards" className={({isActive}) =>
							isActive ? "navbar-link active" : "navbar-link"
						}>
							My Boards
						</NavLink>
					)}
				</div>

				<div className="navbar-actions">
					{isLoggedIn ? (
						// Utilisateur connecté - afficher profil et déconnexion
						<div className="navbar-auth">
							<Link to="/profile" className="navbar-user">
								{/* Ajouter le badge de rôle à côté du nom d'utilisateur */}
								<div className="user-info">
									<span className="username">{currentUser?.username}</span>
									<RoleBadge />
								</div>
							</Link>
							<Button variant="secondary" size="sm" onClick={handleLogout}>
								Log out
							</Button>
						</div>
					) : (
						// Utilisateur non connecté - afficher connexion et inscription
						<div className="navbar-auth">
							<Link to="/login">
								<Button variant="login" size="sm">Log in</Button>
							</Link>
							<Link to="/signup">
								<Button variant="signup" size="sm">Sign up</Button>
							</Link>
						</div>
					)}
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
};

export default Navbar;