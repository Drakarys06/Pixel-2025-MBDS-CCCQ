import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';
import '../../styles/layout/Navbar.css';

interface NavbarProps {
  logoText?: string;
}

const Navbar: React.FC<NavbarProps> = ({ logoText = 'PixelBoard' }) => {
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
        </div>
        
        <div className="navbar-actions">
          <div className="navbar-auth">
            <Link to="/login">
              <Button variant="login" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="signup" size="sm">Sign up</Button>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;