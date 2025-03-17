import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelBoardCard from '../ui/PixelBoardCard';
import { Input, Select } from '../ui/FormComponents';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import { useAuth } from '../AuthContext';
import '../../styles/pages/ExplorePage.css';

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

const ExplorePage: React.FC = () => {
  const [pixelBoards, setPixelBoards] = useState<PixelBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterBy, setFilterBy] = useState<string>('all');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoggedIn) {
      console.log('ExplorePage: Utilisateur non connecté, redirection vers /login');
      navigate('/login', { state: { from: '/explore' } });
    }
  }, [isLoggedIn, navigate]);

  // Fetch pixel boards
  useEffect(() => {
    // Ne charger les données que si l'utilisateur est connecté
    if (!isLoggedIn) return;
    
    const fetchPixelBoards = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupérer le token d'authentification depuis localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/api/pixelboards`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
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
  }, [API_URL, isLoggedIn]);

  // Si l'utilisateur n'est pas connecté, on ne rend rien car la redirection sera effectuée
  if (!isLoggedIn) {
    return <Loader text="Redirecting to login..." />;
  }

  // Sort and filter options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'closing-soon', label: 'Closing Soon' },
    { value: 'az', label: 'A-Z' },
    { value: 'za', label: 'Z-A' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All Boards' },
    { value: 'joinable', label: 'Joinable Boards' },
    { value: 'viewable', label: 'View-only Boards' }
  ];

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

  return (
    <Layout title="Explore Pixel Boards">
      {error && <Alert variant="error" message={error} />}
      
      <div className="explore-filter">
        <div className="filter-options">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
            fullWidth={false}
          />
          
          <Select
            options={filterOptions}
            value={filterBy}
            onChange={setFilterBy}
            fullWidth={false}
          />
        </div>
        
        <div className="search-box">
          <Input
            type="text"
            placeholder="Search boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth={false}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="board-grid-loading">
          <Loader text="Loading boards..." />
        </div>
      ) : filteredAndSortedBoards.length > 0 ? (
        <div className="board-grid">
          {filteredAndSortedBoards.map(board => (
            <PixelBoardCard
              key={board._id}
              id={board._id}
              title={board.title}
              width={board.width}
              length={board.length}
              creationTime={board.creationTime}
              time={board.time}
              closeTime={board.closeTime}
              creator={board.creator}
            />
          ))}
        </div>
      ) : (
        <div className="no-data">
          No pixel boards found matching your search.
        </div>
      )}
    </Layout>
  );
};

export default ExplorePage;