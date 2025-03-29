import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import TimeRemaining from '../ui/TimeRemaining';
import Button from '../ui/Button';
import '../../styles/ui/PixelBoardCard.css';

interface Pixel {
  _id: string;
  x: number;
  y: number;
  color: string;
  lastModifiedDate: string;
  modifiedBy: string[];
  boardId: string;
}

interface PixelBoardCardProps {
  id: string;
  title: string;
  width: number;
  length: number;
  creationTime: string;
  time: number;
  closeTime: string | null;
  creator: string;
  creatorUsername?: string;
  className?: string;
  showSettings?: boolean;
  onSettingsClick?: (id: string) => void;
}

const PixelBoardCard: React.FC<PixelBoardCardProps> = ({
  id,
  title,
  width,
  length,
  creationTime,
  time,
  closeTime,
  creator,
  creatorUsername,
  className = '',
  showSettings = false,
  onSettingsClick
}) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch pixels for this board
  useEffect(() => {
    const fetchPixels = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/pixels?boardId=${id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPixels(data);
        }
      } catch (err) {
        console.error('Error fetching pixels for board preview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPixels();
  }, [id, API_URL]);

  // Draw the preview canvas when pixels change
  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const previewSize = 140;
    canvas.width = previewSize;
    canvas.height = previewSize;

    // Clear the canvas with a completely black background
    ctx.fillStyle = '#000000';  
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If no pixels, draw default pattern
    if (pixels.length === 0) {
      drawDefaultPattern(ctx, previewSize);
      return;
    }

    // Calculate scale to fit the preview
    const maxDimension = Math.max(width, length);
    const cellSize = previewSize / maxDimension;
    
    // Important: Make sure pixels are perfectly aligned
    const offsetX = (previewSize - (width * cellSize)) / 2;
    const offsetY = (previewSize - (length * cellSize)) / 2;

    // Draw pixels exactly with no gaps
    pixels.forEach(pixel => {
      ctx.fillStyle = pixel.color;
      
      // Use exact pixel positions with Math.floor to prevent anti-aliasing
      const x = Math.floor(offsetX + pixel.x * cellSize);
      const y = Math.floor(offsetY + pixel.y * cellSize);
      const w = Math.ceil(cellSize);
      const h = Math.ceil(cellSize);
      
      ctx.fillRect(x, y, w, h);
    });
  }, [pixels, loading, width, length]);

  // Draw a default pattern when no pixels are available
  const drawDefaultPattern = (ctx: CanvasRenderingContext2D, size: number) => {
    const colors = [
      '#9370DB', '#90EE90', '#F0E68C', '#6495ED', 
      '#FF7F50', '#87CEEB', '#FFC0CB', '#98FB98'
    ];
    
    const numCells = 4; // 4x4 grid
    const cellSize = size / numCells;
    
    for (let y = 0; y < numCells; y++) {
      for (let x = 0; x < numCells; x++) {
        // Skip some cells to create a pattern
        if ((x + y) % 2 === 0) {
          const colorIndex = (x * 3 + y * 5) % colors.length;
          ctx.fillStyle = colors[colorIndex];
          
          // Use exact positions with no gaps
          const exactX = Math.floor(x * cellSize);
          const exactY = Math.floor(y * cellSize);
          const exactW = Math.ceil(cellSize);
          const exactH = Math.ceil(cellSize);
          
          ctx.fillRect(exactX, exactY, exactW, exactH);
        }
      }
    }
  };

  // Format the creation date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if board is expired
  const [isExpired, setIsExpired] = React.useState(
    closeTime !== null || new Date(creationTime).getTime() + time * 60 * 1000 < Date.now()
  );

  const handleTimeExpired = () => {
    setIsExpired(true);
  };

  const cardClasses = ['pixel-board-card', className].filter(Boolean).join(' ');

  // Utiliser creatorUsername s'il existe, sinon utiliser creator
  const displayCreator = creatorUsername || creator;

  // Handle settings button click
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to board
    if (onSettingsClick) {
      onSettingsClick(id);
    }
  };

  return (
    <Card className={cardClasses}>
      <div className="pixel-board-preview">
        {loading ? (
          <div className="pixel-preview-loading"></div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="pixel-preview-canvas"
          />
        )}
        <TimeRemaining
          creationTime={creationTime}
          durationMinutes={time}
          closeTime={closeTime}
          showProgressBar={false}
          badge={true}
          onTimeExpired={handleTimeExpired}
        />
      </div>
      
      <div className="card-body">
        <h3 className="pixel-board-title">{title}</h3>
        <div className="pixel-board-meta">
          <span>{width} x {length}</span>
          <span>Created: {formatDate(creationTime)}</span>
        </div>
        
        <TimeRemaining
          creationTime={creationTime}
          durationMinutes={time}
          closeTime={closeTime}
          className="pixel-board-time-progress"
          onTimeExpired={handleTimeExpired}
        />
      </div>
      
      <div className="card-footer">
        <div className="pixel-board-creator">By: {displayCreator}</div>
        <div className="card-actions">
          {showSettings && (
            <button
              className="board-settings-button"
              onClick={handleSettingsClick}
            >
              Settings
            </button>
          )}
          <Link to={`/board/${id}`}>
            <Button 
              variant={isExpired ? 'secondary' : 'join'} 
              size="sm"
            >
              {isExpired ? 'View Board' : 'Join Board'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default PixelBoardCard;