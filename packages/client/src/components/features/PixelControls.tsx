import React from 'react';
import '../../styles/features/PixelControls.css';

interface PixelControlsProps {
  selectedColor: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  showGridLines: boolean;
  onToggleGridLines: (show: boolean) => void;
}

const PixelControls: React.FC<PixelControlsProps> = ({
  selectedColor,
  onColorChange,
  disabled = false,
  showGridLines,
  onToggleGridLines
}) => {
  return (
    <div className="pixel-controls">
      <h3>Pixel Controls</h3>
      
      <div className="color-picker-container">
        {/* Rétablir l'input de type color pour la palette */}
        <input
          type="color"
          value={selectedColor}
          onChange={onColorChange}
          disabled={disabled}
          className="color-picker"
        />
        <input
          type="text"
          value={selectedColor}
          onChange={onColorChange}
          disabled={disabled}
          className="color-text"
        />
      </div>
      
      <div className="instruction-container">
        <h4>How to Place Pixels</h4>
        <ol>
          <li>Select a color</li>
          <li>Click on any cell in the grid to place your pixel</li>
        </ol>
      </div>
      
      <div className="grid-options">
        <label className="grid-toggle">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={(e) => onToggleGridLines(e.target.checked)}
          />
          <span>Show Grid Lines</span>
        </label>
      </div>
    </div>
  );
};

export default PixelControls;