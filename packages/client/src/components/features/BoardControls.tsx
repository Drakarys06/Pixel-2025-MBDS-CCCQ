import React from 'react';
import { ColorPicker } from '../ui/FormComponents';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import { useAuth } from '../auth/AuthContext';
import usePermissions from '../auth/usePermissions';
import PermissionGate from '../auth/PermissionGate';
import { PERMISSIONS } from '../auth/permissions';
import '../../styles/features/BoardControls.css';

interface BoardControlsProps {
  selectedColor: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  message: { text: string; type: 'success' | 'error' } | null;
  disabled: boolean;
  showGridLines: boolean;
  onToggleGridLines: () => void;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
  boardClosed?: boolean;
}

const BoardControls: React.FC<BoardControlsProps> = ({
  selectedColor,
  onColorChange,
  message,
  disabled,
  showGridLines,
  onToggleGridLines,
  showHeatmap = false,
  onToggleHeatmap = () => {},
  boardClosed = false
}) => {
  const { currentUser } = useAuth();
  const permissions = usePermissions();

  return (
    <Card className="board-controls">
      <div className="card-header">
        <h3 className="controls-title">Pixel Controls</h3>
      </div>

      <div className="card-body">
        {/* Toujours visible pour tous les utilisateurs */}
        <div className="view-options">
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={showGridLines}
              onChange={onToggleGridLines}
            />
            Show Grid Lines
          </label>
        </div>

        {/* Le mode heatmap est disponible pour tous */}
        {onToggleHeatmap && (
          <div className="heatmap-toggle-container">
            <Button
              variant={showHeatmap ? "primary" : "secondary"}
              onClick={onToggleHeatmap}
              className={`heatmap-toggle-button ${showHeatmap ? 'active' : ''}`}
              fullWidth
            >
              {showHeatmap ? 'Exit Heatmap Mode' : 'Show Heatmap View'}
            </Button>
            {showHeatmap && (
              <div className="heatmap-active-indicator">
                Heatmap mode active - Showing frequency of modifications
              </div>
            )}
          </div>
        )}

        {/* Contrôles de placement de pixels conditionnels basés sur les permissions */}
        <PermissionGate 
          permission={PERMISSIONS.PIXEL_CREATE}
          fallback={
            <div className="permission-notice">
              {boardClosed 
                ? "This board is closed and no longer accepts modifications." 
                : "You don't have permission to place pixels on this board."}
            </div>
          }
        >
          {!boardClosed && (
            <div className="controls-form">
              {currentUser && (
                <div className="user-info">
                  <p>Logged in as: {currentUser.username}</p>
                </div>
              )}

              <ColorPicker
                value={selectedColor}
                onChange={onColorChange}
                disabled={disabled || showHeatmap} // Disable color picker when heatmap is active
              />

              <div className="controls-instructions">
                <h4 className="instructions-title">How to Place Pixels</h4>
                <ol className="instructions-list">
                  <li>Select a color</li>
                  <li>Click on any cell in the grid to place your pixel</li>
                </ol>
              </div>
            </div>
          )}
        </PermissionGate>

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