import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

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
	visitor: boolean;
}

const BoardView: React.FC = () => {
	// Votre route est configurée avec /board/:id (non pas /board/:boardId)
	const params = useParams();
	const location = useLocation();
	const boardId = params.id; // Utiliser params.id au lieu de params.boardId

	// Debug information for params
	console.log('URL Path:', location.pathname);
	console.log('All URL Params:', params);
	console.log('Extracted boardId from params:', boardId);
	const [board, setBoard] = useState<PixelBoard | null>(null);
	const [pixels, setPixels] = useState<Pixel[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedColor, setSelectedColor] = useState<string>('#000000');
	const [userId, setUserId] = useState<string>('');
	const [placingPixel, setPlacingPixel] = useState<boolean>(false);
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Fetch board details
	useEffect(() => {
		const fetchBoardDetails = async () => {
			// Get boardId from the URL if not available from params
			let currentBoardId = boardId;
			if (!currentBoardId) {
				// Try to extract from URL path as fallback
				const pathParts = location.pathname.split('/');
				currentBoardId = pathParts[pathParts.length - 1];
				console.log('Extracted boardId from URL:', currentBoardId);
			}

			if (!currentBoardId) {
				setError('Board ID is missing');
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				// Use a simple query to test the API connection first
				console.log('Testing API connection...');
				const testResponse = await fetch(`${API_URL}/api`);
				console.log('API test response:', testResponse.ok ? 'OK' : 'Failed');

				console.log('Fetching board from:', `${API_URL}/api/pixelboards/${currentBoardId}`);
				const response = await fetch(`${API_URL}/api/pixelboards/${currentBoardId}`);

				if (!response.ok) {
					const contentType = response.headers.get('content-type');
					let errorMessage = `Failed to fetch board details: ${response.status} ${response.statusText}`;

					if (contentType && contentType.includes('application/json')) {
						const errorData = await response.json();
						console.error('Error data:', errorData);
						errorMessage += ` - ${errorData.message || 'Unknown error'}`;
					} else {
						const errorText = await response.text();
						console.error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
						errorMessage += ` - ${errorText || 'Unknown error'}`;
					}

					throw new Error(errorMessage);
				}

				const data = await response.json();
				console.log('Board data received:', data);

				if (!data) {
					throw new Error('No board data received');
				}

				setBoard(data);

				// Fetch pixels after board is loaded
				fetchPixels(currentBoardId);
			} catch (err) {
				console.error('Error fetching board details:', err);
				setError(err instanceof Error ? err.message : 'Failed to load board. Please try again.');
			} finally {
				setLoading(false);
			}
		};

		fetchBoardDetails();
	}, [boardId, API_URL, location]);

	// Fetch pixels for this board
	const fetchPixels = async (boardId: string) => {
		if (!boardId) return;

		try {
			console.log(`Fetching pixels for board ID: ${boardId}`);
			const response = await fetch(`${API_URL}/api/pixels?boardId=${boardId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch pixels');
			}
			const data = await response.json();
			console.log(`Received ${data.length} pixels:`, data);
			setPixels(data);
		} catch (err) {
			console.error('Error fetching pixels:', err);
		}
	};

	// Set up polling for real-time updates (every 10 seconds)
	useEffect(() => {
		if (!board) return;

		console.log("Setting up pixel polling");
		const interval = setInterval(() => fetchPixels(board._id), 10000);
		return () => clearInterval(interval);
	}, [board, API_URL]);

	// Handle user ID input
	const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserId(e.target.value);
	};

	// Handle color selection
	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedColor(e.target.value);
	};

	// Handle pixel placement
	const handlePlacePixel = async (x: number, y: number) => {
		if (!userId) {
			setMessage({ text: 'Please enter a user ID', type: 'error' });
			return;
		}

		if (!boardId) return;

		setPlacingPixel(true);
		try {
			const response = await fetch(`${API_URL}/api/pixels/board/${boardId}/place`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					x,
					y,
					color: selectedColor,
					userId
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to place pixel');
			}

			const newPixel = await response.json();

			// Update the pixels array
			setPixels(prev => {
				// Check if this pixel already exists at this position
				const existingIndex = prev.findIndex(p => p.x === x && p.y === y);
				if (existingIndex >= 0) {
					// Replace the existing pixel
					const newPixels = [...prev];
					newPixels[existingIndex] = newPixel;
					return newPixels;
				} else {
					// Add the new pixel
					return [...prev, newPixel];
				}
			});

			setMessage({ text: 'Pixel placed successfully!', type: 'success' });

			// Clear success message after 3 seconds
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

	if (loading) {
		return <div className="loading">Loading board...</div>;
	}

	if (!loading && (error || !board)) {
		// Get ID from URL path as fallback
		const pathParts = location.pathname.split('/');
		const urlBoardId = pathParts[pathParts.length - 1];

		return (
			<div className="error-container">
				<div className="error-message">{error || 'Board not found'}</div>
				<div>
					<p>Debugging Information:</p>
					<pre>
            URL Path: {location.pathname}<br/>
            Extracted Board ID: {urlBoardId}<br/>
            Params Board ID: {boardId}<br/>
            API URL: {API_URL}
          </pre>
				</div>
				<div className="debug-buttons">
					<button
						onClick={() => {
							setError(null);
							setLoading(true);

							// Use the ID from the URL if the param is missing
							const idToUse = boardId || urlBoardId;

							console.log(`Trying to manually fetch board with ID: ${idToUse}`);
							fetch(`${API_URL}/api/pixelboards/${idToUse}`)
								.then(response => {
									console.log('Manual fetch response:', response.status, response.statusText);
									if (!response.ok) {
										return response.text().then(text => {
											throw new Error(`Status: ${response.status}, Response: ${text}`);
										});
									}
									return response.json();
								})
								.then(data => {
									console.log('Manual fetch result:', data);
									setBoard(data);
									setLoading(false);
								})
								.catch(err => {
									console.error('Manual fetch error:', err);
									setError(`Manual fetch failed: ${err.message}`);
									setLoading(false);
								});
						}}
					>
						Try loading again
					</button>

					<button
						onClick={() => {
							window.open(`${API_URL}/api/pixelboards`, '_blank');
						}}
					>
						Test API (List All Boards)
					</button>
				</div>
				<Link to="/explore" className="back-link">Back to Explore</Link>
			</div>
		);
	}

	// Create the grid of cells
	const renderGrid = () => {
		if (!board) return null;

		// Créer un tableau 2D de cellules directement
		const cells = [];

		for (let y = 0; y < board.length; y++) {
			for (let x = 0; x < board.width; x++) {
				const pixel = pixels.find(p => p.x === x && p.y === y);
				cells.push(
					<div
						key={`${x}-${y}`}
						className="grid-cell"
						style={{
							backgroundColor: pixel ? pixel.color : 'white',
							cursor: placingPixel ? 'not-allowed' : 'pointer',
							border: '1px solid black'
						}}
						onClick={() => !placingPixel && handlePlacePixel(x, y)}
						title={`(${x}, ${y})`}
					/>
				);
			}
		}

		return cells;
	};

	return (
		<div className="board-view-container">
			<header className="board-header">
				<Link to="/explore" className="back-button">← Back to Explore</Link>
				<h1>{board?.title || 'Loading...'}</h1>
				{board && (
					<div className="board-meta">
						<span>Size: {board.width} x {board.length}</span>
						<span>Created by: {board.creator}</span>
						<span>Redraw allowed: {board.redraw ? 'Yes' : 'No'}</span>
					</div>
				)}
				<ThemeToggle />
			</header>

			{loading ? (
				<div className="loading">Loading board data...</div>
			) : error ? (
				<div className="error-message">{error}</div>
			) : board ? (
				<div className="board-content">
					<div className="controls-panel">
						<div className="user-controls">
							<div className="control-group">
								<label htmlFor="userId">Your User ID:</label>
								<input
									type="text"
									id="userId"
									value={userId}
									onChange={handleUserIdChange}
									placeholder="Enter your user ID"
									disabled={placingPixel}
								/>
							</div>

							<div className="control-group">
								<label htmlFor="colorPicker">Selected Color:</label>
								<div className="color-picker-container">
									<input
										type="color"
										id="colorPicker"
										value={selectedColor}
										onChange={handleColorChange}
										disabled={placingPixel}
									/>
									<input
										type="text"
										value={selectedColor}
										onChange={handleColorChange}
										pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
										disabled={placingPixel}
									/>
								</div>
							</div>
						</div>

						<div className="instructions">
							<h3>How to Place Pixels</h3>
							<ol>
								<li>Enter your User ID</li>
								<li>Select a color</li>
								<li>Click on any cell in the grid to place your pixel</li>
							</ol>
						</div>

						{message && (
							<div className={`message ${message.type}`}>
								{message.text}
							</div>
						)}
					</div>

					<div className="board-grid-container">
						{board && (
							<div className="board-info-bar">
								<div>Board dimensions: {board.width} × {board.length}</div>
								<div>Pixels placed: {pixels.length}</div>
							</div>
						)}
						<div
							className="board-grid"
							style={{
								display: 'grid',
								gridTemplateColumns: `repeat(${board.width}, 25px)`,
								gridTemplateRows: `repeat(${board.length}, 25px)`,
								gap: '1px',
								backgroundColor: 'black',
								border: '2px solid black',
								margin: '0 auto'
							}}
						>
							{renderGrid()}
						</div>
						<div className="grid-coordinates">
							<div className="coordinate-label">Click on a cell to place a pixel</div>
						</div>
					</div>
				</div>
			) : (
				<div className="no-data">No board data available</div>
			)}
		</div>
	);
};

export default BoardView;
