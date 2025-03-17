import React from 'react';
import { Input } from '../ui/FormComponents';
import { ColorPicker } from '../ui/FormComponents';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import '../../styles/features/BoardControls.css';

interface BoardControlsProps {
  userId: string;
  onUserIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedColor: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  message: { text: string; type: 'success' | 'error' } | null;
  disabled: boolean;
  showGridLines: boolean;
  onToggleGridLines: () => void;
}

const BoardControls: React.FC<BoardControlsProps> = ({
  userId,
  onUserIdChange,
  selectedColor,
  onColorChange,
  message,
  disabled,
  showGridLines,
  onToggleGridLines
}) => {
  return (
    <Card className="board-controls">
      <Card.Header>
        <h3 className="controls-title">Pixel Controls</h3>
      </Card.Header>
      
      <Card.Body>
        <div className="controls-form">
          <Input
            label="Your User ID"
            type="text"
            value={userId}
            onChange={onUserIdChange}
            placeholder="Enter your user ID"
            disabled={disabled}
            required
          />
          
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
            <li>Enter your User ID</li>
            <li>Select a color</li>
            <li>Click on any cell in the grid to place your pixel</li>
          </ol>
        </div>

        <label className="toggle-grid-lines">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={onToggleGridLines}
          />
          Show Grid Lines
        </label>
        
        {message && (
          <Alert
            variant={message.type}
            message={message.text}
            className="controls-message"
            dismissible={false}
            duration={3000}
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default BoardControls;