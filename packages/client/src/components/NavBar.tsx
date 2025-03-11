import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import AuthNavStatus from './AuthNavStatus';

const Navbar: React.FC = () => {
  return (
    <header className="explore-header">
      <nav className="explore-nav">
        <Link to="/" className="explore-logo">PixelBoard</Link>
        
        <div className="nav-links">
          <NavLink to="/explore" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            Explore
          </NavLink>
          <NavLink to="/create" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            Create
          </NavLink>
          <NavLink to="/boards" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            My Boards
          </NavLink>
        </div>
        
        <div className="nav-actions">
          <AuthNavStatus />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;