import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthNavStatus: React.FC = () => {
  const { isLoggedIn, currentUser, logout } = useAuth();
  
  // Log pour déboguer
  console.log('Auth state in NavStatus:', { isLoggedIn, currentUser });

  const handleLogout = () => {
    logout();
    // Optionnel: rediriger vers la page d'accueil après déconnexion
    // window.location.href = '/';
  };

  return (
    <div className="nav-auth">
      {isLoggedIn ? (
        // Utilisateur connecté
        <div className="auth-user-info">
          <Link to="/profile" className="user-profile-link">
            <span className="username">{currentUser?.username}</span>
          </Link>
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