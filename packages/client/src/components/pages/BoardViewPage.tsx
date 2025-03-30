// Modified BoardViewPage.tsx to include the timelapse component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelGrid, { PixelGridRef } from '../features/PixelGrid';
import BoardInfo from '../features/BoardInfo';
import BoardControls from '../features/BoardControls';
import BoardContributors, { Contributor } from '../features/BoardContributors';
import BoardTimelapse from '../features/BoardTimelapse'; // Import the new component
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import ExportCanvas from '../ui/ExportCanvas';
import websocketService from '../../services/websocketService';
import { useAuth } from '../auth/AuthContext';
import usePermissions from '../auth/usePermissions';
import '../../styles/pages/BoardViewPage.css';

interface Pixel {
	_id: string;
	x: number;
	y: number;
	color: string;
	lastModifiedDate: string;
	modifiedBy: string[];
	boardId: string;
	modificationCount: number;
}

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
	creatorUsername?: string;
	contributors: Contributor[];
	cooldown: number;
	visitor: boolean;
	readOnly?: boolean;
}

const BoardViewPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { currentUser } = useAuth();
	const permissions = usePermissions();
	const [board, setBoard] = useState<PixelBoard | null>(null);
	const [pixels, setPixels] = useState<Pixel[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedColor, setSelectedColor] = useState<string>('#000000');
	const [placingPixel, setPlacingPixel] = useState<boolean>(false);
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
	const [showGridLines, setShowGridLines] = useState<boolean>(false);
	const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
	const [showTimelapse, setShowTimelapse] = useState<boolean>(false); // New state for timelapse visibility
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
	const pixelGridRef = useRef<PixelGridRef>(null);
	const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
	const [cooldownTotal, setCooldownTotal] = useState<number>(0);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	const boardConnectionRef = useRef(false);

	// WebSocket setup
	useEffect(() => {
		if (!id || !board) return;

		// Connect to WebSocket
		if (!websocketService.isConnected()) {
			websocketService.connect();
		}

		// Join the board
		if (!boardConnectionRef.current) {
			console.log(`Joining board: ${id}`);
			websocketService.joinBoard(id);
			boardConnectionRef.current = true;

			// Listener for pixel updates
			websocketService.onPixelPlaced((pixelData) => {
				console.log('Received pixel placed event:', pixelData);

				setPixels(prev => {
					const existingIndex = prev.findIndex(p =>
						p.x === pixelData.x && p.y === pixelData.y
					);

					if (existingIndex >= 0) {
						const newPixels = [...prev];
						newPixels[existingIndex] = pixelData;
						return newPixels;
					} else {
						return [...prev, pixelData];
					}
				});

				// Refresh contributors when new pixel is placed via WebSocket
				setRefreshTrigger(prev => prev + 1);
			});
		}

		// Clean up on unmount
		return () => {
			if (boardConnectionRef.current) {
				console.log(`Leaving board: ${id}`);
				websocketService.leaveBoard(id);
				websocketService.removeListener('pixelPlaced');
				boardConnectionRef.current = false;
			}
		};
	}, [id, board]);

	// Fetch pixels for this board
	const fetchPixels = useCallback(async (boardId: string) => {
		if (!boardId) return;

		try {
			// Add auth token
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/pixels?boardId=${boardId}`, {
				headers: {
					'Authorization': token ? `Bearer ${token}` : ''
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to fetch pixels');
			}

			const data = await response.json();
			setPixels(data);
		} catch (err) {
			console.error('Error fetching pixels:', err);
		}
	}, [API_URL]);

	// Fetch board details
	useEffect(() => {
		const fetchBoardDetails = async () => {
			if (!id) return;

			setLoading(true);
			try {
				const token = localStorage.getItem('token');

				const response = await fetch(`${API_URL}/api/pixelboards/${id}`, {
					headers: {
						'Authorization': token ? `Bearer ${token}` : ''
					}
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || 'Failed to fetch board details');
				}

				const data = await response.json();
				setBoard(data);
				setCooldownTotal(data.cooldown || 0);

				// Fetch pixels after board is loaded
				fetchPixels(id);
			} catch (err) {
				console.error('Error fetching board details:', err);
				setError(err instanceof Error ? err.message : 'Failed to load board. Please try again.');
			} finally {
				setLoading(false);
			}
		};

		fetchBoardDetails();
	}, [id, API_URL, fetchPixels]);

	useEffect(() => {
		if (!board || !currentUser || !board.contributors) return;

		const userContributor = board.contributors.find(
			(contributor) => contributor.userId === currentUser.id
		);

		if (userContributor && userContributor.lastPixelTime) {
			const lastPixelTime = new Date(userContributor.lastPixelTime).getTime();
			const currentTime = Date.now();
			const elapsedTime = Math.floor((currentTime - lastPixelTime) / 1000);
			const remainingCooldown = Math.max(board.cooldown - elapsedTime, 0);

			setCooldownRemaining(remainingCooldown);
			console.log('Remaining cooldown:', remainingCooldown);
		}
	}, [board, currentUser]);

	// Set up polling for real-time updates as fallback (every 10 seconds)
	useEffect(() => {
		if (!board) return;

		const interval = setInterval(() => fetchPixels(board._id), 10000);
		return () => clearInterval(interval);
	}, [board, fetchPixels]);

	// Handle color selection
	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedColor(e.target.value);
	};

	// Toggle heatmap view
	const toggleHeatmap = () => {
		setShowHeatmap(prev => !prev);
		if (showTimelapse) setShowTimelapse(false); // Turn off timelapse when heatmap is enabled
	};

	// Toggle timelapse view
	const toggleTimelapse = () => {
		setShowTimelapse(prev => !prev);
		if (showHeatmap) setShowHeatmap(false); // Turn off heatmap when timelapse is enabled
	};

	// Handle pixel placement
	const handlePlacePixel = async (x: number, y: number) => {
		if (!id || !board || !currentUser) return;

		if (!permissions.canCreatePixel()) {
			setMessage({
				text: 'You do not have permission to place pixels',
				type: 'error'
			});
			return;
		}

		if (cooldownRemaining > 0) {
			return;
		}

		const existingPixel = pixels.find(p => p.x === x && p.y === y);
		if (existingPixel && !board.redraw) {
			setMessage({
				text: 'Redrawing over existing pixels is not allowed on this board',
				type: 'error'
			});
			return;
		}

		setPlacingPixel(true);
		try {
			// Get auth token
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_URL}/api/pixels/board/${id}/place`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token ? `Bearer ${token}` : ''
				},
				body: JSON.stringify({
					x,
					y,
					color: selectedColor
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to place pixel');
			}

			const newPixel = await response.json();

			setPixels(prev => {
				const existingIndex = prev.findIndex(p => p.x === x && p.y === y);
				if (existingIndex >= 0) {
					const newPixels = [...prev];
					newPixels[existingIndex] = newPixel;
					return newPixels;
				} else {
					return [...prev, newPixel];
				}
			});

			// Increment refresh trigger for contributors
			setRefreshTrigger(prev => prev + 1);

			setMessage({ text: 'Pixel placed successfully!', type: 'success' });

			setCooldownRemaining(cooldownTotal);

			setTimeout(() => {
				setMessage(null);
			}, 3000);
		} catch (err) {
			console.error('Error placing pixel:', err);
			setMessage({
				text: err instanceof Error ? err.message : 'Failed to place pixel',
				type: 'error'
			});
		} finally {
			setPlacingPixel(false);
		}
	};

	useEffect(() => {
		if (cooldownRemaining > 0) {
			const timer = setInterval(() => {
				setCooldownRemaining((prev) => Math.max(prev - 1, 0));
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [cooldownRemaining]);

	const handleCooldownComplete = () => {
		console.log('Cooldown complete!');
	};

	// Check if board is expired
	const isBoardExpired = (): boolean => {
		if (!board) return false;

		if (board.closeTime) return true;

		const creation = new Date(board.creationTime);
		const durationMs = board.time * 60 * 1000;
		const endTime = new Date(creation.getTime() + durationMs);

		return new Date() > endTime;
	};

	// Check if the user can modify the board
	const canModifyBoard = (): boolean => {
		if (!board || !currentUser) return false;

		// Check if board is expired or closed
		if (isBoardExpired()) return false;

		// Check if user has permission to create pixels
		if (!permissions.canCreatePixel()) return false;

		// For visitor-restricted boards, check if visitor mode is enabled
		if (permissions.isGuest() && !board.visitor) return false;

		// If readOnly flag is set on the board (from server), respect it
		if (board.readOnly) return false;

		return true;
	};

	if (loading) {
		return (
			<Layout>
				<div className="board-loading">
					<Loader text="Loading board..." />
				</div>
			</Layout>
		);
	}

	if (error || !board) {
		return (
			<Layout>
				<Alert
					variant="error"
					message={error || 'Board not found'}
					className="board-error"
				/>
				<div className="board-error-actions">
					<button
						className="board-retry-button"
						onClick={() => window.location.reload()}
					>
						Try Again
					</button>
				</div>
			</Layout>
		);
	}

	const boardClosed = isBoardExpired();
	const canPlacePixels = canModifyBoard();

	return (
		<Layout>
			<BoardInfo
				title={board.title}
				creator={board.creatorUsername || board.creator}
				width={board.width}
				height={board.length}
				creationTime={board.creationTime}
				duration={board.time}
				closeTime={board.closeTime}
				redraw={board.redraw}
				pixelCount={pixels.length}
				visitor={board.visitor}
			/>

			<div className="board-view-content">
				<div className="board-controls-container">
					<BoardControls
						selectedColor={selectedColor}
						onColorChange={handleColorChange}
						message={message}
						disabled={!canPlacePixels || placingPixel || showTimelapse}
						showGridLines={showGridLines}
						onToggleGridLines={() => setShowGridLines(!showGridLines)}
						showHeatmap={showHeatmap}
						onToggleHeatmap={toggleHeatmap}
						cooldownRemaining={cooldownRemaining}
						cooldownTotal={cooldownTotal}
						onCooldownComplete={handleCooldownComplete}
						boardClosed={boardClosed}
						visitorMode={board.visitor}
						showTimelapse={showTimelapse}
						onToggleTimelapse={toggleTimelapse}
					/>

					{/* Add BoardContributors component */}
					<BoardContributors
						boardId={board._id}
						refreshTrigger={refreshTrigger}
					/>

					{/* ExportCanvas from main branch */}
					<ExportCanvas
						getCanvasData={() => pixelGridRef.current?.getCanvas() || null}
						pixelGridRef={pixelGridRef}
						boardWidth={board.width}
						boardHeight={board.length}
						className="board-export-button"
					/>
				</div>

				<div className="board-grid-container">
					{showTimelapse ? (
						<BoardTimelapse
							pixels={pixels}
							width={board.width}
							height={board.length}
							boardId={board._id}
						/>
					) : (
						<PixelGrid
							ref={pixelGridRef}
							width={board.width}
							height={board.length}
							pixels={pixels}
							editable={canPlacePixels}
							onPixelClick={handlePlacePixel}
							loading={placingPixel}
							showGridLines={showGridLines}
							showHeatmap={showHeatmap}
						/>
					)}
				</div>
			</div>
		</Layout>
	);
};

export default BoardViewPage;
