import React, { useState, useEffect, useRef } from 'react';
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

interface PixelBoardListProps {
  pixelBoards: PixelBoard[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const PixelBoardList: React.FC<PixelBoardListProps> = ({ pixelBoards, loading, onDelete }) => {
  const [timeData, setTimeData] = useState<TimeData>({});
  const pixelBoardsRef = useRef(pixelBoards);
  
  useEffect(() => {
    pixelBoardsRef.current = pixelBoards;
    
    updateTimeData();
    
    const timer = setInterval(() => {
      updateTimeData();
    }, 10000); 
    return () => clearInterval(timer);
  }, [pixelBoards]);
  
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

  if (loading) {
    return <div className="loading">Loading pixel boards...</div>;
  }

  if (pixelBoards.length === 0) {
    return <div className="no-data">No pixel boards found. Create one to get started.</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="pixel-board-list">
      <h2>Your Pixel Boards</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Size</th>
            <th>Creator</th>
            <th>Created</th>
            <th>Settings</th>
            <th>Time Remaining</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pixelBoards.map((board) => {
            const boardTimeData = timeData[board._id] || {
              timeRemaining: "Calculating...",
              isExpired: false,
              percentRemaining: 100
            };
            
            const { timeRemaining, isExpired, percentRemaining } = boardTimeData;
            
            return (
              <tr key={board._id}>
                <td>{board.title}</td>
                <td>{board.width} x {board.length}</td>
                <td>{board.creator}</td>
                <td>{formatDate(board.creationTime)}</td>
                <td>
                  <span>Time: {board.time} min</span><br />
                  <span>Redraw: {board.redraw ? 'Yes' : 'No'}</span><br />
                  <span>Visitor Mode: {board.visitor ? 'Yes' : 'No'}</span>
                </td>
                <td>
                  <div className="time-remaining">
                    <div className="time-text" style={{ color: isExpired ? 'var(--error-color)' : percentRemaining < 25 ? 'orange' : 'var(--text-primary)' }}>
                      {timeRemaining}
                    </div>
                    {!isExpired && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${percentRemaining}%`,
                            backgroundColor: percentRemaining < 25 ? 'orange' : 'var(--accent-color)'
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <button onClick={() => onDelete(board._id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PixelBoardList;