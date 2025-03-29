import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelGrid, { PixelGridRef } from '../features/PixelGrid';
import BoardInfo from '../features/BoardInfo';
import BoardControls from '../features/BoardControls';
import BoardContributors from '../features/BoardContributors';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import ExportCanvas from '../ui/ExportCanvas';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/BoardViewPage.css';

interface Pixel {
	_id: string;
	x: number;
	y: number;
	color: string;
	lastModifiedDate: string;
	modifiedBy: string[];
	boardId: string;
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
	visitor: boolean;
}

const BoardViewPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { currentUser } = useAuth();
	const [board, setBoard] = useState<PixelBoard | null>(null);
	const [pixels, setPixels] = useState<Pixel[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedColor, setSelectedColor] = useState<string>('#000000');
	const [placingPixel, setPlacingPixel] = useState<boolean>(false);
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
	const [showGridLines, setShowGridLines] = useState<boolean>(false);
	// Add state for heatmap
	const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
	const [contributorsRefreshTrigger, setContributorsRefreshTrigger] = useState<number>(0);
	const pixelGridRef = useRef<PixelGridRef>(null);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Fetch pixels for this board
	const fetchPixels = useCallback(async (boardId: string) => {
		if (!boardId) return;

		try {
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/pixels?boardId=${boardId}`, {
				headers: {
					'Authorization': token ? `Bearer ${token}` : ''
				}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch pixels');
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
					throw new Error('Failed to fetch board details');
				}

				const data = await response.json();
				setBoard(data);

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

	// Set up polling for real-time updates (every 10 seconds)
	useEffect(() => {
		if (!board) return;

		const interval = setInterval(() => fetchPixels(board._id), 10000);
		return () => clearInterval(interval);
	}, [board, fetchPixels]);

	// Handle color selection
	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedColor(e.target.value);
	};

	// Add toggle for heatmap mode
	const handleToggleHeatmap = () => {
		setShowHeatmap(prevState => !prevState);
	};

	// Handle pixel placement
	const handlePlacePixel = async (x: number, y: number) => {
		if (!id || !board || !currentUser || showHeatmap) return; // Prevent placing pixels in heatmap mode

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

			setMessage({ text: 'Pixel placed successfully!', type: 'success' });

			// Déclencher le rafraîchissement des contributeurs
			setContributorsRefreshTrigger(prev => prev + 1);

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

	// Check if board is expired
	const isBoardExpired = (): boolean => {
		if (!board) return false;

		if (board.closeTime) return true;

		const creation = new Date(board.creationTime);
		const durationMs = board.time * 60 * 1000;
		const endTime = new Date(creation.getTime() + durationMs);

		return new Date() > endTime;
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
			/>

			<div className="board-view-content">
				<div className="board-controls-container">
					<BoardControls
						selectedColor={selectedColor}
						onColorChange={handleColorChange}
						message={message}
						disabled={isBoardExpired() || placingPixel}
						showGridLines={showGridLines}
						onToggleGridLines={() => setShowGridLines(!showGridLines)}
						// Heatmap props
						showHeatmap={showHeatmap}
						onToggleHeatmap={handleToggleHeatmap}
					/>

					{/* Ajout du composant pour afficher les contributeurs avec le déclencheur de rafraîchissement */}
					<BoardContributors
						boardId={board._id}
						refreshTrigger={contributorsRefreshTrigger}
					/>

					<ExportCanvas
						getCanvasData={() => pixelGridRef.current?.getCanvas() || null}
						pixelGridRef={pixelGridRef}
						boardWidth={board.width}
						boardHeight={board.length}
						className="board-export-button"
					/>
				</div>

				<div className="board-grid-container">
					<PixelGrid
						ref={pixelGridRef}
						width={board.width}
						height={board.length}
						pixels={pixels}
						editable={!isBoardExpired() && !showHeatmap} // Disable editing in heatmap mode
						onPixelClick={handlePlacePixel}
						loading={placingPixel}
						showGridLines={showGridLines}
						// Add heatmap prop
						showHeatmap={showHeatmap}
					/>
				</div>
			</div>
		</Layout>
	);
};

export default BoardViewPage;
