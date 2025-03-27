import React from 'react';
import { FiEye } from 'react-icons/fi';
import '../../styles/features/BoardControls.css';

interface Message {
  text: string;
  type: 'success' | 'error';
}

interface BoardControlsProps {
  selectedColor: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  message: Message | null;
  disabled: boolean;
  showGridLines: boolean;
  onToggleGridLines: () => void;
}

const BoardControls: React.FC<BoardControlsProps> = ({
  selectedColor,
  onColorChange,
  message,
  disabled,
  showGridLines,
  onToggleGridLines
}) => {
  return (
    <div className="board-controls">
      <div className="control-section">
        <h3>Options d'affichage</h3>
        <div className="control-item">
          <button
            className={`grid-toggle ${showGridLines ? 'active' : ''}`}
            onClick={onToggleGridLines}
            title="Afficher/masquer les lignes de la grille"
          >
            <FiEye />
            <span>Lignes de grille</span>
          </button>
        </div>
      </div>
      
      <div className="control-section">
        <h3>Placement de pixels</h3>
        <div className="control-item">
          <label htmlFor="colorPicker">Couleur:</label>
          <div className="color-input-group">
            <input
              type="color"
              id="colorPicker"
              value={selectedColor}
              onChange={onColorChange}
              disabled={disabled}
              className={disabled ? 'disabled' : ''}
            />
            <input
              type="text"
              value={selectedColor}
              onChange={onColorChange}
              disabled={disabled}
              className={disabled ? 'disabled' : ''}
            />
          </div>
        </div>
        
        {disabled && (
          <div className="control-status">
            {message ? (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            ) : (
              <div className="message info">
                {disabled ? 'Modification actuellement désactivée' : 'Cliquez sur la grille pour placer un pixel'}
              </div>
            )}
          </div>
        )}
      </div>
      
      {!disabled && message && (
        <div className="control-section">
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        </div>
      )}
      
      <div className="control-section">
        <div className="control-instructions">
          <h3>Instructions</h3>
          <ol>
            <li>Sélectionnez une couleur avec le sélecteur</li>
            <li>Cliquez sur un pixel de la grille pour le placer</li>
            <li>Le tableau est mis à jour en temps réel</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default BoardControls;