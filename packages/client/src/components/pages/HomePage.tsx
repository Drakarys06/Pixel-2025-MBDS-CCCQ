import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import Button from '../ui/Button';
import '../../styles/pages/HomePage.css';

const HomePage: React.FC = () => {
  return (
    <Layout showNavbar={true}>
      <div className="home-content">
        <div className="home-text">
          <h1 className="home-title">Welcome to PixelBoard</h1>
          <p className="home-description">Create, share, and collaborate on pixel art canvases</p>
          
          <div className="home-buttons">
            <Link to="/create">
              <Button variant="primary" size="lg">Create New Board</Button>
            </Link>
            <Link to="/explore">
              <Button variant="secondary" size="lg">Explore Boards</Button>
            </Link>
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
    </Layout>
  );
};

export default HomePage;