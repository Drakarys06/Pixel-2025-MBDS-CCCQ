import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/HomePage.css';
import ThemeToggle from './ThemeToggle';

const HomePage: React.FC = () => {
  return (
    <div className="home-container">
      <header className="explore-header home-header">
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
            <div className="nav-auth">
              <Link to="/login" className="btn-login">Log in</Link>
              <Link to="/signup" className="btn-signup">Sign up</Link>
            </div>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      
      <div className="home-content">
        <div className="home-text">
          <h1>Welcome to PixelBoard</h1>
          <p>Create, share, and collaborate on pixel art canvases</p>
          
          <div className="home-buttons">
            <Link to="/create" className="btn-primary">Create New Board</Link>
            <Link to="/explore" className="btn-secondary">Explore Boards</Link>
          </div>
        </div>
        
        <div className="pixel-preview">
          <div className="pixel-block" style={{ backgroundColor: '#9370DB', top: '0', right: '0' }}></div>
          <div className="pixel-block" style={{ backgroundColor: '#90EE90', top: '60px', right: '120px' }}></div>
          <div className="pixel-block" style={{ backgroundColor: '#F0E68C', top: '0', right: '60px' }}></div>
          <div className="pixel-block" style={{ backgroundColor: '#6495ED', top: '120px', right: '180px' }}></div>
          <div className="pixel-block" style={{ backgroundColor: '#98FB98', top: '120px', right: '120px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;