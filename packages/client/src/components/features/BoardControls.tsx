import React from 'react';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import CooldownTimer from '../ui/CooldownTimer';
import ColorPicker from '../ui/ColorPicker';
import { useAuth } from '../auth/AuthContext';
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
	showHeatmap: boolean;
	onToggleHeatmap: () => void;
	cooldownRemaining: number;
	cooldownTotal: number;
	onCooldownComplete?: () => void;
	boardClosed?: boolean;
	visitorMode?: boolean;
	showTimelapse?: boolean;
	onToggleTimelapse?: () => void;
}

const BoardControls: React.FC<BoardControlsProps> = ({
	selectedColor,
	onColorChange,
	message,
	disabled,
	showGridLines,
	onToggleGridLines,
	showHeatmap = false,
	onToggleHeatmap = () => { },
	cooldownRemaining,
	cooldownTotal,
	onCooldownComplete,
	boardClosed = false,
	visitorMode = false,
	showTimelapse = false,
	onToggleTimelapse = () => { },
}) => {
	const { isGuestMode } = useAuth();

	return (
		<Card className="board-controls">
			<div className="card-header">
				<h3 className="controls-title">Pixel Controls</h3>
			</div>

			<div className="card-body">
				{/* Explicit check for guest users */}
				{isGuestMode && !visitorMode ? (
					<div className="permission-notice">
						Guest users cannot place pixels on this board.
					</div>
				) : (
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
						{!boardClosed && !showTimelapse && (
							<div className="controls-form">
								{/* Cooldown timer - only show if there is a cooldown */}
								{cooldownTotal > 0 && (
									<CooldownTimer
										remainingSeconds={cooldownRemaining}
										totalSeconds={cooldownTotal}
										onCooldownComplete={onCooldownComplete}
									/>
								)}

								{/* Color Picker */}
								<ColorPicker
									selectedColor={selectedColor}
									onColorChange={onColorChange}
									disabled={disabled || showHeatmap}
								/>
							</div>
						)}
					</PermissionGate>
				)}

				{/* Board control */}
				<div className="zoom-move-instructions">
					Use mouse wheel to zoom<br />
					Right-click + drag to move around
				</div>

				{/* View Options section */}
				<div className="view-options-section">
					<div className="view-toggle-buttons">
						{/* Timelapse toggle button */}
						<Button
							variant={showTimelapse ? "primary" : "secondary"}
							onClick={onToggleTimelapse}
							className={`view-toggle-button ${showTimelapse ? 'active' : ''}`}
							fullWidth
						>
							{showTimelapse ? 'Exit Timelapse Mode' : 'Show Timelapse'}
						</Button>

						{/* Heatmap toggle button */}
						<Button
							variant={showHeatmap ? "primary" : "secondary"}
							onClick={onToggleHeatmap}
							className={`view-toggle-button ${showHeatmap ? 'active' : ''}`}
							fullWidth
							disabled={showTimelapse}
						>
							{showHeatmap ? 'Exit Heatmap Mode' : 'Show Heatmap View'}
						</Button>
					</div>

					{showTimelapse && (
						<div className="mode-active-indicator">
							Timelapse mode active - Watch the board evolution
						</div>
					)}

					{showHeatmap && (
						<div className="mode-active-indicator">
							Heatmap mode active - Showing frequency of modifications
						</div>
					)}

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
