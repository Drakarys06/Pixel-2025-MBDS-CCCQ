import React from 'react';
import { Link } from 'react-router-dom';
import TimeRemaining from '../ui/TimeRemaining';
import '../../styles/features/BoardInfo.css';

interface BoardInfoProps {
  title: string;
  creator: string;
  width: number;
  height: number;
  creationTime: string;
  duration: number;
  closeTime: string | null;
  redraw: boolean;
  pixelCount: number;
}

const BoardInfo: React.FC<BoardInfoProps> = ({
  title,
  creator,
  width,
  height,
  creationTime,
  duration,
  closeTime,
  redraw,
  pixelCount
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate if board is expired
  const isExpired = React.useMemo(() => {
    if (closeTime) return true;
    
    const creation = new Date(creationTime);
    const end = new Date(creation.getTime() + duration * 60 * 1000);
    return new Date() > end;
  }, [creationTime, duration, closeTime]);

  return (
    <div className="board-info">
      <div className="board-header">
        <Link to="/explore" className="board-back-button">
          ← Back to Explore
        </Link>
        <h1 className="board-title">{title}</h1>
      </div>
      
      <div className="board-meta">
        <div className="board-meta-item">
          <span className="meta-label">Created by:</span>
          <span className="meta-value">{creator}</span>
        </div>
        
        <div className="board-meta-item">
          <span className="meta-label">Dimensions:</span>
          <span className="meta-value">{width} × {height}</span>
        </div>
        
        <div className="board-meta-item">
          <span className="meta-label">Created on:</span>
          <span className="meta-value">{formatDate(creationTime)}</span>
        </div>
        
        <div className="board-meta-item">
          <span className="meta-label">Redraw allowed:</span>
          <span className="meta-value">{redraw ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="board-meta-item">
          <span className="meta-label">Pixels placed:</span>
          <span className="meta-value">{pixelCount}</span>
        </div>
      </div>
      
      <div className="board-time-status">
        <span className={`board-status ${isExpired ? 'status-expired' : 'status-active'}`}>
          {isExpired ? 'Board Expired - View Only' : 'Board Active'}
        </span>
        
        <TimeRemaining
          creationTime={creationTime}
          durationMinutes={duration}
          closeTime={closeTime}
          className="board-time-remaining"
        />
      </div>
    </div>
  );
};

export default BoardInfo;