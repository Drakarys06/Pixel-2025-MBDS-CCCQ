import React from 'react';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import CooldownTimer from '../ui/CooldownTimer';
import EnhancedColorPicker from '../ui/EnhancedColorPicker'; // Importez le nouveau composant
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
						{!boardClosed && (
							<div className="controls-form">
								{/* Cooldown timer - only show if there is a cooldown */}
								{cooldownTotal > 0 && (
									<CooldownTimer
										remainingSeconds={cooldownRemaining}
										totalSeconds={cooldownTotal}
										onCooldownComplete={onCooldownComplete}
									/>
								)}

								{/* Enhanced Color Picker */}
								<EnhancedColorPicker
									selectedColor={selectedColor}
									onColorChange={onColorChange}
									disabled={disabled || showHeatmap}
								/>
							</div>
						)}
					</PermissionGate>
				)}

				{/* View Options section */}
				<div className="view-options-section">
					{/* Heatmap toggle button */}
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
