import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="main-nav">
      <Link to="/" className="logo">PixelBoard</Link>
      
      <div className="nav-links">
        <Link to="/explore" className="nav-link">Explore</Link>
        <Link to="/boards" className="nav-link">My Boards</Link>
        <Link to="/create" className="nav-link">Create</Link>
      </div>
      
      <div className="nav-auth">
        <Link to="/login" className="btn btn-login">Log in</Link>
        <Link to="/signup" className="btn btn-signup">Sign up</Link>
      </div>
    </nav>
  );
};

export default Navbar;