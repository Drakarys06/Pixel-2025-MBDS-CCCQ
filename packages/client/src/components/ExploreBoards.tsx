import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/ExploreBoards.css';
import ThemeToggle from './ThemeToggle';

interface PixelBoard {
  _id: string;
  title: string;
  length: number;
  width: number;
  time: number;
  redraw: boolean;
  closeTime: string | null;
  creationTime: string;
  creator: string;
  visitor: boolean;
}

const ExploreBoards: React.FC = () => {
  const [pixelBoards, setPixelBoards] = useState<PixelBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchPixelBoards = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/pixelboards`);
        if (!response.ok) {
          throw new Error('Failed to fetch pixel boards');
        }
        const data = await response.json();
        setPixelBoards(data);
      } catch (err) {
        console.error('Error fetching pixel boards:', err);
        setError('Unable to load boards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPixelBoards();
  }, [API_URL]);

  // Generate random colors for pixel blocks in previews
  const getRandomColor = () => {
    const colors = ['#9370DB', '#90EE90', '#F0E68C', '#6495ED', '#98FB98', '#FF7F50', '#87CEEB'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Sort and filter the boards
  const filteredAndSortedBoards = React.useMemo(() => {
    let result = [...pixelBoards];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(board => 
        board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        board.creator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort the boards
    switch (sortBy) {
      case 'newest':
        return result.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
      case 'oldest':
        return result.sort((a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());
      case 'az':
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case 'za':
        return result.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return result;
    }
  }, [pixelBoards, searchTerm, sortBy]);

  // Render loading placeholders
  const renderLoadingPlaceholders = () => {
    return Array(8).fill(0).map((_, index) => (
      <div key={`placeholder-${index}`} className="board-card">
        <div className="board-preview shimmer" style={{ height: '180px' }}></div>
        <div className="board-info">
          <div className="shimmer" style={{ height: '24px', width: '80%', marginBottom: '8px' }}></div>
          <div className="shimmer" style={{ height: '16px', width: '60%', marginBottom: '12px' }}></div>
        </div>
        <div className="board-footer">
          <div className="shimmer" style={{ height: '16px', width: '40%' }}></div>
          <div className="shimmer" style={{ height: '30px', width: '80px' }}></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="explore-container">
      {/* Header with navigation */}
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
            <div className="nav-auth">
              <Link to="/login" className="btn-login">Log in</Link>
              <Link to="/signup" className="btn-signup">Sign up</Link>
            </div>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <div className="explore-content">
        <h1 className="explore-title">Explore Pixel Boards</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="explore-filter">
          <div className="filter-options">
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </div>
          
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="board-grid">
            {renderLoadingPlaceholders()}
          </div>
        ) : filteredAndSortedBoards.length > 0 ? (
          <div className="board-grid">
            {filteredAndSortedBoards.map(board => (
              <div key={board._id} className="board-card">
                <div className="board-preview">
                  {/* Random pixel blocks for preview */}
                  <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '30px', left: '40px' }}></div>
                  <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '70px', left: '80px' }}></div>
                  <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '110px', left: '40px' }}></div>
                  <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '50px', left: '120px' }}></div>
                  <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '90px', left: '160px' }}></div>
                </div>
                
                <div className="board-info">
                  <h3 className="board-title">{board.title}</h3>
                  <div className="board-meta">
                    <span>{board.width} x {board.length}</span>
                    <span>Created: {formatDate(board.creationTime)}</span>
                  </div>
                </div>
                
                <div className="board-footer">
                  <div className="board-creator">By: {board.creator}</div>
                  <Link to={`/board/${board._id}`} className="btn-join">Join Board</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            No pixel boards found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreBoards;