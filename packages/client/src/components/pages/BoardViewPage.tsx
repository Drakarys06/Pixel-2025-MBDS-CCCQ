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
  readOnly?: boolean; // Indique si l'utilisateur courant peut modifier ce tableau
}

const BoardViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isGuestMode } = useAuth(); // Récupérer l'utilisateur connecté et son statut de visiteur
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
  
  // Références pour gérer les requêtes et l'intervalle de polling
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const pixelGridRef = useRef<PixelGridRef>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch pixels for this board
  const fetchPixels = useCallback(async (boardId: string) => {
    if (!boardId) return;

    // Annuler toute requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau controller pour cette requête
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
      // Ne pas afficher d'erreur si c'est une annulation intentionnelle
      if (err.name !== 'AbortError') {
        console.error('Error fetching pixels:', err);
      }
    }
  }, [API_URL]);

  // Fetch board details
  useEffect(() => {
    const fetchBoardDetails = async () => {
      if (!id) return;

      // Annuler toute requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Créer un nouveau controller pour cette requête
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
        
        // Vérifier si le tableau est en lecture seule
        if (data.readOnly) {
          setReadOnly(true);
        }
        
        setBoard(data);

        // Fetch pixels after board is loaded
        fetchPixels(id);
      } catch (err: any) {
        // Ne pas afficher d'erreur si c'est une annulation intentionnelle
        if (err.name !== 'AbortError') {
          console.error('Error fetching board details:', err);
          setError(err instanceof Error ? err.message : 'Failed to load board. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoardDetails();
    
    // Nettoyer les requêtes en cours lors du démontage
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, API_URL, fetchPixels]);

  // Set up polling for real-time updates (every 10 seconds)
  useEffect(() => {
    if (!board) return;

    // Nettoyer l'intervalle précédent si existant
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
    }

    // Démarrer un nouvel intervalle
    intervalIdRef.current = window.setInterval(() => {
      fetchPixels(board._id);
    }, 10000);

    // Nettoyer l'intervalle au démontage ou lorsque board change
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

    // Empêcher la modification en mode lecture seule
    if (readOnly) {
      setMessage({
        text: 'Vous êtes en mode lecture seule. La modification n\'est pas autorisée.',
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
    
    // Créer un nouvel AbortController pour cette requête
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
      
      // Déclencher le rafraîchissement des contributeurs
      setContributorsRefreshTrigger(prev => prev + 1);

      // Utiliser un timeout pour effacer le message après un délai
      const timeoutId = window.setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      // Nettoyer le timeout si le composant est démonté
      return () => {
        window.clearTimeout(timeoutId);
      };
      
    } catch (err: any) {
      // Ne pas afficher d'erreur si c'est une annulation intentionnelle
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
              <div className="read-only-badge">Mode lecture seule</div>
              <p>Vous pouvez voir ce tableau mais pas le modifier. {isGuestMode && "Créez un compte pour plus d'options."}</p>
            </div>
          )}
          
          {/* Ajout du composant pour afficher les contributeurs avec le déclencheur de rafraîchissement */}
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