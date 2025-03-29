import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelGrid, { PixelGridRef } from '../features/PixelGrid';
import BoardInfo from '../features/BoardInfo';
import PixelControls from '../features/PixelControls';
import BoardContributors from '../features/BoardContributors';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import ExportCanvas from '../ui/ExportCanvas';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/BoardViewPage.css';

interface Pixel {
  _id: string;
  x: number;
  y: number;
  color: string;
  lastModifiedDate: string;
  modifiedBy: string[];
  boardId: string;
}

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
  creatorUsername?: string;
  visitor: boolean;
  readOnly?: boolean; // Indicates if the current user can modify this board
}

const BoardViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isGuestMode } = useAuth(); // Get the logged in user and guest status
  const [board, setBoard] = useState<PixelBoard | null>(null);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#68ce37');
  const [placingPixel, setPlacingPixel] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showGridLines, setShowGridLines] = useState<boolean>(false);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [contributorsRefreshTrigger, setContributorsRefreshTrigger] = useState<number>(0);
  
  // References to manage requests and polling interval
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const pixelGridRef = useRef<PixelGridRef>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch pixels for this board
  const fetchPixels = useCallback(async (boardId: string) => {
    if (!boardId) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/pixels?boardId=${boardId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pixels');
      }
      const data = await response.json();
      setPixels(data);
    } catch (err: any) {
      // Don't display an error if it's an intentional abort
      if (err.name !== 'AbortError') {
        console.error('Error fetching pixels:', err);
      }
    }
  }, [API_URL]);

  // Fetch board details
  useEffect(() => {
    const fetchBoardDetails = async () => {
      if (!id) return;

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/pixelboards/${id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('Failed to fetch board details');
        }

        const data = await response.json();
        
        // Check if the board is read-only
        if (data.readOnly) {
          setReadOnly(true);
        }
        
        setBoard(data);

        // Fetch pixels after board is loaded
        fetchPixels(id);
      } catch (err: any) {
        // Don't display an error if it's an intentional abort
        if (err.name !== 'AbortError') {
          console.error('Error fetching board details:', err);
          setError(err instanceof Error ? err.message : 'Failed to load board. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoardDetails();
    
    // Clean up ongoing requests during unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, API_URL, fetchPixels]);

  // Set up polling for real-time updates (every 10 seconds)
  useEffect(() => {
    if (!board) return;

    // Clear previous interval if it exists
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
    }

    // Start a new interval
    intervalIdRef.current = window.setInterval(() => {
      fetchPixels(board._id);
    }, 10000);

    // Clean up the interval on unmount or when board changes
    return () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [board, fetchPixels]);

  // Handle color selection
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value);
  };

  // Handle pixel placement
  const handlePlacePixel = async (x: number, y: number) => {
    if (!id || !board || !currentUser) return;

    // Prevent modification in read-only mode
    if (readOnly) {
      setMessage({
        text: 'You are in read-only mode. Modification is not allowed.',
        type: 'error'
      });
      return;
    }

    const existingPixel = pixels.find(p => p.x === x && p.y === y);
    if (existingPixel && !board.redraw) {
      setMessage({
        text: 'Redrawing over existing pixels is not allowed on this board',
        type: 'error'
      });
      return;
    }

    setPlacingPixel(true);
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/pixels/board/${id}/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          x,
          y,
          color: selectedColor
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place pixel');
      }

      const newPixel = await response.json();

      setPixels(prev => {
        const existingIndex = prev.findIndex(p => p.x === x && p.y === y);
        if (existingIndex >= 0) {
          const newPixels = [...prev];
          newPixels[existingIndex] = newPixel;
          return newPixels;
        } else {
          return [...prev, newPixel];
        }
      });

      setMessage({ text: 'Pixel placed successfully!', type: 'success' });
      
      // Trigger contributors refresh
      setContributorsRefreshTrigger(prev => prev + 1);

      // Use a timeout to clear the message after a delay
      const timeoutId = window.setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      // Clean up the timeout if the component is unmounted
      return () => {
        window.clearTimeout(timeoutId);
      };
      
    } catch (err: any) {
      // Don't display an error if it's an intentional abort
      if (err.name !== 'AbortError') {
        console.error('Error placing pixel:', err);
        setMessage({
          text: err instanceof Error ? err.message : 'Failed to place pixel',
          type: 'error'
        });
      }
    } finally {
      setPlacingPixel(false);
    }
  };

  // Check if board is expired
  const isBoardExpired = (): boolean => {
    if (!board) return false;

    if (board.closeTime) return true;

    const creation = new Date(board.creationTime);
    const durationMs = board.time * 60 * 1000;
    const endTime = new Date(creation.getTime() + durationMs);

    return new Date() > endTime;
  };

  if (loading) {
    return (
      <Layout>
        <div className="board-loading">
          <Loader text="Loading board..." />
        </div>
      </Layout>
    );
  }

  if (error || !board) {
    return (
      <Layout>
        <Alert
          variant="error"
          message={error || 'Board not found'}
          className="board-error"
        />
        <div className="board-error-actions">
          <button
            className="board-retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BoardInfo
        title={board.title}
        creator={board.creatorUsername || board.creator}
        width={board.width}
        height={board.length}
        creationTime={board.creationTime}
        duration={board.time}
        closeTime={board.closeTime}
        redraw={board.redraw}
        pixelCount={pixels.length}
      />

      <div className="board-view-content">
        <div className="pixel-controls-wrapper">
          <PixelControls
            selectedColor={selectedColor}
            onColorChange={handleColorChange}
            disabled={isBoardExpired() || placingPixel || readOnly}
            showGridLines={showGridLines}
            onToggleGridLines={setShowGridLines}
          />
          
          {message && (
            <div className={`message-container ${message.type}`}>
              <p>{message.text}</p>
            </div>
          )}
          
          {readOnly && (
            <div className="read-only-indicator">
              <div className="read-only-badge">Read Only Mode</div>
              <p>You can view this board but not modify it. {isGuestMode && "Create an account for more options."}</p>
            </div>
          )}
          
          {/* Add component to display contributors with refresh trigger */}
          <BoardContributors
            boardId={board._id}
            refreshTrigger={contributorsRefreshTrigger}
          />

          <ExportCanvas
            getCanvasData={() => pixelGridRef.current?.getCanvas() || null}
            pixelGridRef={pixelGridRef}
            boardWidth={board.width}
            boardHeight={board.length}
            className="board-export-button"
          />
        </div>

        <div className="board-grid-container">
          <PixelGrid
            ref={pixelGridRef}
            width={board.width}
            height={board.length}
            pixels={pixels}
            editable={!isBoardExpired() && !readOnly}
            onPixelClick={handlePlacePixel}
            loading={placingPixel}
            showGridLines={showGridLines}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BoardViewPage;