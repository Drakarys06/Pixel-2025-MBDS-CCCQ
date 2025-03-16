import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';
import { useAuth } from '../AuthContext';
import '../../styles/layout/Navbar.css';

interface NavbarProps {
  logoText?: string;
}

const Navbar: React.FC<NavbarProps> = ({ logoText = 'PixelBoard' }) => {
  const { isLoggedIn, currentUser, logout } = useAuth();

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
          
          {isLoggedIn && (
            <>
              <NavLink to="/create" className={({isActive}) => 
                isActive ? "navbar-link active" : "navbar-link"
              }>
                Create
              </NavLink>
              <NavLink to="/boards" className={({isActive}) => 
                isActive ? "navbar-link active" : "navbar-link"
              }>
                My Boards
              </NavLink>
            </>
          )}
        </div>
        
        <div className="navbar-actions">
          {isLoggedIn ? (
            // Utilisateur connecté - afficher profil et déconnexion
            <div className="navbar-auth">
              <Link to="/profile">
                <Button variant="login" size="sm">{currentUser?.username}</Button>
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