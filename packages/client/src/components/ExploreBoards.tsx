import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/ExploreBoards.css';
import ThemeToggle from './ThemeToggle';
import { calculateRemainingTime } from '../utils/timeUtils';

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

interface TimeData {
  [key: string]: {
    timeRemaining: string;
    isExpired: boolean;
    percentRemaining: number;
  }
}

const ExploreBoards: React.FC = () => {
  const [pixelBoards, setPixelBoards] = useState<PixelBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [timeData, setTimeData] = useState<TimeData>({});
  
  const pixelBoardsRef = useRef(pixelBoards);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Update only the time data every 10 seconds
  useEffect(() => {
    pixelBoardsRef.current = pixelBoards;
    
    // Initial calculation
    updateTimeData();
    
    const timer = setInterval(() => {
      updateTimeData();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(timer);
  }, [pixelBoards]);
  
  // Update just the time data without re-rendering the whole component
  const updateTimeData = () => {
    const newTimeData: TimeData = {};
    
    pixelBoardsRef.current.forEach(board => {
      newTimeData[board._id] = calculateRemainingTime(
        board.creationTime,
        board.time,
        board.closeTime
      );
    });
    
    setTimeData(newTimeData);
  };

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
    
    // Apply status filter
    if (filterBy !== 'all') {
      // Get current time for comparison
      const now = new Date();
      
      result = result.filter(board => {
        const creationDate = new Date(board.creationTime);
        const durationMs = board.time * 60 * 1000;
        const closingDate = new Date(creationDate.getTime() + durationMs);
        const isExpired = board.closeTime !== null || now > closingDate;
        
        if (filterBy === 'joinable') {
          return !isExpired;
        } else if (filterBy === 'viewable') {
          return isExpired;
        }
        return true;
      });
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
      case 'closing-soon':
        return result.sort((a, b) => {
          // Closed boards go to the end
          if (a.closeTime && !b.closeTime) return 1;
          if (!a.closeTime && b.closeTime) return -1;
          if (a.closeTime && b.closeTime) return 0;
          
          // Sort by time remaining
          const aEndTime = new Date(new Date(a.creationTime).getTime() + (a.time * 60 * 1000));
          const bEndTime = new Date(new Date(b.creationTime).getTime() + (b.time * 60 * 1000));
          return aEndTime.getTime() - bEndTime.getTime();
        });
      default:
        return result;
    }
  }, [pixelBoards, searchTerm, sortBy, filterBy]);

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
              <option value="closing-soon">Closing Soon</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
            
            <select 
              className="filter-select"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="all">All Boards</option>
              <option value="joinable">Joinable Boards</option>
              <option value="viewable">View-only Boards</option>
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
            {filteredAndSortedBoards.map(board => {
              // Get the time data for this board from our state
              const boardTimeData = timeData[board._id] || {
                timeRemaining: "Calculating...",
                isExpired: false,
                percentRemaining: 100
              };
              
              const { timeRemaining, isExpired, percentRemaining } = boardTimeData;
              
              return (
                <div key={board._id} className="board-card">
                  <div className="board-preview">
                    {/* Random pixel blocks for preview */}
                    <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '30px', left: '40px' }}></div>
                    <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '70px', left: '80px' }}></div>
                    <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '110px', left: '40px' }}></div>
                    <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '50px', left: '120px' }}></div>
                    <div className="pixel-block-small" style={{ backgroundColor: getRandomColor(), top: '90px', left: '160px' }}></div>
                    
                    {/* Remaining time badge */}
                    <div className={`time-badge ${isExpired ? 'expired' : percentRemaining < 25 ? 'ending-soon' : ''}`}>
                      {timeRemaining}
                    </div>
                  </div>
                  
                  <div className="board-info">
                    <h3 className="board-title">{board.title}</h3>
                    <div className="board-meta">
                      <span>{board.width} x {board.length}</span>
                      <span>Created: {formatDate(board.creationTime)}</span>
                    </div>
                    
                    {/* Time progress bar */}
                    {!isExpired && (
                      <div className="time-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${percentRemaining}%`,
                              backgroundColor: percentRemaining < 25 ? 'var(--error-color)' : 'var(--accent-color)'
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="board-footer">
                    <div className="board-creator">By: {board.creator}</div>
                    <Link to={`/board/${board._id}`} className={isExpired ? "btn-view" : "btn-join"}>
                      {isExpired ? 'View Board' : 'Join Board'}
                    </Link>
                  </div>
                </div>
              );
            })}
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