import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

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
    const params = useParams();
    const location = useLocation();
    const boardId = params.id;

    const [board, setBoard] = useState<PixelBoard | null>(null);
    const [pixels, setPixels] = useState<Pixel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>('#000000');
    const [userId, setUserId] = useState<string>('');
    const [placingPixel, setPlacingPixel] = useState<boolean>(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const fetchBoardDetails = async () => {
            let currentBoardId = boardId;
            if (!currentBoardId) {
                const pathParts = location.pathname.split('/');
                currentBoardId = pathParts[pathParts.length - 1];
            }

            if (!currentBoardId) {
                setError('Board ID is missing');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/pixelboards/${currentBoardId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch board details');
                }

                const data = await response.json();
                setBoard(data);

                fetchPixels(currentBoardId);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load board. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchBoardDetails();
    }, [boardId, API_URL, location]);

    const fetchPixels = async (boardId: string) => {
        if (!boardId) return;

        try {
            const response = await fetch(`${API_URL}/api/pixels?boardId=${boardId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch pixels');
            }
            const data = await response.json();
            setPixels(data);
        } catch (err) {
            console.error('Error fetching pixels:', err);
        }
    };

    useEffect(() => {
        if (!board) return;

        const interval = setInterval(() => fetchPixels(board._id), 10000);
        return () => clearInterval(interval);
    }, [board, API_URL]);

	useEffect(() => {
		const resizeCanvas = () => {
			if (!canvasRef.current || !board) return;
	
			const canvas = canvasRef.current;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
	
			const scale = Math.min(window.innerWidth / (board.width * 25), window.innerHeight / (board.length * 25));
			canvas.width = board.width * 25 * scale;
			canvas.height = board.length * 25 * scale;
	
			ctx.clearRect(0, 0, canvas.width, canvas.height);
	
			pixels.forEach(pixel => {
				ctx.fillStyle = pixel.color;
				ctx.fillRect(pixel.x * 25 * scale, pixel.y * 25 * scale, 25 * scale, 25 * scale);
			});
		};
	
		window.addEventListener('resize', resizeCanvas);
		resizeCanvas();
	
		return () => window.removeEventListener('resize', resizeCanvas);
	}, [pixels, board]);

    const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserId(e.target.value);
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedColor(e.target.value);
    };

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

            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (err) {
            setMessage({
                text: err instanceof Error ? err.message : 'Failed to place pixel',
                type: 'error'
            });
        } finally {
            setPlacingPixel(false);
        }
    };

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current || !board) return;
	
		const rect = canvasRef.current.getBoundingClientRect();
		const scale = Math.min(window.innerWidth / (board.width * 25), window.innerHeight / (board.length * 25));
		const x = Math.floor((e.clientX - rect.left) / (25 * scale));
		const y = Math.floor((e.clientY - rect.top) / (25 * scale));
	
		handlePlacePixel(x, y);
	};

    if (loading) {
        return <div className="loading">Loading board...</div>;
    }

    if (!loading && (error || !board)) {
        const pathParts = location.pathname.split('/');
        const urlBoardId = pathParts[pathParts.length - 1];

        return (
            <div className="error-container">
                <div className="error-message">{error || 'Board not found'}</div>
                <div>
                    <p>Debugging Information:</p>
                    <pre>
                        URL Path: {location.pathname}<br />
                        Extracted Board ID: {urlBoardId}<br />
                        Params Board ID: {boardId}<br />
                        API URL: {API_URL}
                    </pre>
                </div>
                <div className="debug-buttons">
                    <button
                        onClick={() => {
                            setError(null);
                            setLoading(true);

                            const idToUse = boardId || urlBoardId;

                            fetch(`${API_URL}/api/pixelboards/${idToUse}`)
                                .then(response => {
                                    if (!response.ok) {
                                        return response.text().then(text => {
                                            throw new Error(`Status: ${response.status}, Response: ${text}`);
                                        });
                                    }
                                    return response.json();
                                })
                                .then(data => {
                                    setBoard(data);
                                    setLoading(false);
                                })
                                .catch(err => {
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

    return (
        <div className="board-view-container">
            <header className="explore-header home-header">
                <nav className="explore-nav">
                    <Link to="/explore" className="back-button">← Back to Explore</Link>

                    <div className="nav-links">
                        <p className="explore-logo">{board?.title || 'Loading...'}</p>
                    </div>

                    <div className="nav-actions">
                        <label htmlFor="userId">User :</label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={handleUserIdChange}
                            placeholder="Testing"
                            disabled={placingPixel}
                            defaultValue="Testing"
                        />
                        <div className="nav-auth">
                            <Link to="/login" className="btn-login">Log out</Link>
                        </div>
                        <ThemeToggle />
                    </div>
                </nav>
            </header>

            {board && (
                <div className="board-meta">
                    <span>Size: {board.width} x {board.length}</span>
                    <span>Created by: {board.creator}</span>
                    <span>Redraw allowed: {board.redraw ? 'Yes' : 'No'}</span>
                </div>
            )}

            {loading ? (
                <div className="loading">Loading board data...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : board ? (
                <div className="board-content">
                    <div className="controls-panel">
                        <div className="user-controls">
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

                        {message && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    <div className="board-grid-container">
                        {board && (
                            <div className="board-info-bar">
                                <div>Pixels placed: {pixels.length}</div>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            width={board.width * 25}
                            height={board.length * 25}
                            style={{
                                border: '2px solid black',
                                margin: '0 auto',
                                cursor: placingPixel ? 'not-allowed' : 'pointer'
                            }}
                            onClick={handleCanvasClick}
                        />
                    </div>
                </div>
            ) : (
                <div className="no-data">No board data available</div>
            )}
        </div>
    );
};

export default BoardView;