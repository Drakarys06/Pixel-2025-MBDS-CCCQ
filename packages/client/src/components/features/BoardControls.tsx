import React from 'react';
import { ColorPicker } from '../ui/FormComponents';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { useAuth } from '../auth/AuthContext';
import '../../styles/features/BoardControls.css';

interface BoardControlsProps {
  // Suppression de userId et onUserIdChange
  selectedColor: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  message: { text: string; type: 'success' | 'error' } | null;
  disabled: boolean;
}

const BoardControls: React.FC<BoardControlsProps> = ({
  selectedColor,
  onColorChange,
  message,
  disabled
}) => {
  // Utiliser le contexte d'authentification pour obtenir l'utilisateur
  const { currentUser, isGuestMode } = useAuth();

  return (
    <Card className="board-controls">
      <div className="card-header">
        <h3 className="controls-title">Pixel Controls</h3>
      </div>
      
      <div className="card-body">
        <div className="controls-form">
          {currentUser && (
            <div className="user-info">
              <span className="user-label">Logged in as:</span>
              <span className="user-value">
                {currentUser.username} {isGuestMode ? "(Guest)" : ""}
              </span>
            </div>
          )}
          
          <ColorPicker
            label="Selected Color"
            value={selectedColor}
            onChange={onColorChange}
            disabled={disabled}
          />
        </div>
        
        <div className="controls-instructions">
          <h4 className="instructions-title">How to Place Pixels</h4>
          <ol className="instructions-list">
            <li>Select a color</li>
            <li>Click on any cell in the grid to place your pixel</li>
          </ol>
        </div>
        
        {message && (
          <Alert
            variant={message.type}
            message={message.text}
            className="controls-message"
            dismissible={false}
            duration={3000}
          />
        )}
      </div>
    </Card>
  );
};

export default BoardControls;