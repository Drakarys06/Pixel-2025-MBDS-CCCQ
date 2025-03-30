// packages/client/src/components/features/BoardTimelapse.tsx - Version améliorée avec historique
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import '../../styles/features/BoardTimelapse.css';

interface PixelHistoryEntry {
	_id: string;
	x: number;
	y: number;
	color: string;
	timestamp: string;
	userId: string;
	username: string;
	boardId: string;
}

interface BoardTimelapseProps {
	width: number;
	height: number;
	boardId: string;
}

const BoardTimelapse: React.FC<BoardTimelapseProps> = ({ width, height, boardId }) => {
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [currentFrame, setCurrentFrame] = useState<number>(0);
	const [speed, setSpeed] = useState<number>(1); // Frames per second multiplier
	const [timelineFrames, setTimelineFrames] = useState<PixelHistoryEntry[][]>([]);
	const [progress, setProgress] = useState<number>(0);
	const [pixelHistory, setPixelHistory] = useState<PixelHistoryEntry[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number | null>(null);
	const lastFrameTimeRef = useRef<number>(0);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Fetch pixel history data from the server
	useEffect(() => {
		const fetchPixelHistory = async () => {
			if (!boardId) return;

			setLoading(true);
			setError(null);

			try {
				// Get auth token
				const token = localStorage.getItem('token');

				const response = await fetch(`${API_URL}/api/pixels/board/${boardId}/history`, {
					headers: {
						'Authorization': token ? `Bearer ${token}` : ''
					}
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch pixel history: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				if (!data.history || !Array.isArray(data.history)) {
					throw new Error('Invalid history data received');
				}

				setPixelHistory(data.history);
			} catch (err) {
				console.error('Error fetching pixel history:', err);
				setError(err instanceof Error ? err.message : 'Failed to load pixel history');
			} finally {
				setLoading(false);
			}
		};

		fetchPixelHistory();
	}, [boardId, API_URL]);

	// Prepare the timelapse frames by grouping history entries
	useEffect(() => {
		if (pixelHistory.length === 0) return;

		// Sort history by timestamp (should already be sorted from the API, but just to be sure)
		const sortedHistory = [...pixelHistory].sort((a, b) =>
			new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		);

		// Group history into frames - each frame represents the board state at a specific time
		// For simplicity, we'll create frames at regular intervals
		const frameCount = Math.min(100, sortedHistory.length); // Limit to 100 frames maximum
		const historyLength = sortedHistory.length;

		const frames: PixelHistoryEntry[][] = [];
		const pixelsPerFrame = Math.ceil(historyLength / frameCount);

		// Build cumulative frames (each frame includes all preceding entries)
		for (let i = 0; i < frameCount; i++) {
			const frameEndIndex = Math.min((i + 1) * pixelsPerFrame, historyLength);
			frames.push(sortedHistory.slice(0, frameEndIndex));
		}

		setTimelineFrames(frames);
		setCurrentFrame(0);
	}, [pixelHistory]);

	// Function to render a frame based on pixel history state
	const renderFrameFromHistory = (historyEntries: PixelHistoryEntry[]) => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

		// Calculate cell size
		const cellWidth = canvasRef.current.width / width;
		const cellHeight = canvasRef.current.height / height;

		// Create a map to store the latest state of each pixel
		const pixelMap = new Map<string, PixelHistoryEntry>();

		// For each history entry, update the pixelMap with the latest state
		historyEntries.forEach(entry => {
			const key = `${entry.x},${entry.y}`;
			pixelMap.set(key, entry);
		});

		// Draw each pixel based on the latest state
		pixelMap.forEach(pixel => {
			ctx.fillStyle = pixel.color;
			ctx.fillRect(
				pixel.x * cellWidth,
				pixel.y * cellHeight,
				cellWidth,
				cellHeight
			);
		});
	};

	// Render the current frame based on history
	const renderFrame = useCallback(() => {
		if (!canvasRef.current || timelineFrames.length === 0) return;

		// Get the current frame's history entries
		const frameEntries = timelineFrames[currentFrame];

		// Render this frame
		renderFrameFromHistory(frameEntries);

		// Update progress
		const progressValue = (currentFrame / (timelineFrames.length - 1)) * 100;
		setProgress(progressValue);
	}, [currentFrame, timelineFrames, width, height]);

	// Animation loop
	const animate = useCallback((timestamp: number) => {
		if (!isPlaying || timelineFrames.length === 0) return;

		// Calculate time elapsed since last frame
		const elapsed = timestamp - lastFrameTimeRef.current;

		// Determine frame rate based on speed (adjust as needed)
		const frameInterval = 1000 / (3 * speed); // Base rate of 3 fps

		if (elapsed > frameInterval) {
			lastFrameTimeRef.current = timestamp;

			// Advance to next frame
			if (currentFrame < timelineFrames.length - 1) {
				setCurrentFrame(prev => prev + 1);
			} else {
				setIsPlaying(false); // Stop at the end
				return;
			}
		}

		animationRef.current = requestAnimationFrame(animate);
	}, [isPlaying, currentFrame, timelineFrames.length, speed]);

	// Start/stop animation when isPlaying changes
	useEffect(() => {
		if (isPlaying) {
			lastFrameTimeRef.current = performance.now();
			animationRef.current = requestAnimationFrame(animate);
		} else if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
		};
	}, [isPlaying, animate]);

	// Render frame when currentFrame changes
	useEffect(() => {
		renderFrame();
	}, [currentFrame, renderFrame]);

	// Resize canvas on mount and when dimensions change
	useEffect(() => {
		if (!canvasRef.current) return;

		const resizeCanvas = () => {
			if (!canvasRef.current) return;

			// Get container dimensions
			const container = canvasRef.current.parentElement;
			if (!container) return;

			const containerWidth = container.clientWidth;
			const aspectRatio = width / height;

			// Set canvas size maintaining aspect ratio
			canvasRef.current.width = containerWidth;
			canvasRef.current.height = containerWidth / aspectRatio;

			renderFrame();
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	}, [width, height, renderFrame]);

	// Handlers for playback controls
	const handlePlayPause = () => {
		// If at the end, restart from beginning
		if (currentFrame === timelineFrames.length - 1 && !isPlaying) {
			setCurrentFrame(0);
		}
		setIsPlaying(!isPlaying);
	};

	const handleReset = () => {
		setIsPlaying(false);
		setCurrentFrame(0);
	};

	const handleSpeedChange = (multiplier: number) => {
		setSpeed(multiplier);
	};

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		const frameIndex = Math.min(
			Math.floor((value / 100) * (timelineFrames.length - 1)),
			timelineFrames.length - 1
		);
		setCurrentFrame(frameIndex);
	};

	// Format time for display
	const formatTimestamp = (index: number): string => {
		if (timelineFrames.length === 0 || index >= timelineFrames.length) return '00:00';

		const historyEntries = timelineFrames[index];
		if (historyEntries.length === 0) return '00:00';

		// Get timestamp of the most recent entry in this frame
		const lastEntry = historyEntries[historyEntries.length - 1];
		const date = new Date(lastEntry.timestamp);

		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	if (loading) {
		return (
			<div className="timelapse-container">
				<div className="timelapse-loading">
					<Loader text="Loading pixel history..." />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="timelapse-container">
				<div className="timelapse-error">
					<p>{error}</p>
					<Button
						variant="secondary"
						onClick={() => window.location.reload()}
					>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="timelapse-container">
			<div className="timelapse-header">
				<h3>Board Evolution Timeline</h3>
				<div className="timelapse-info">
					{timelineFrames.length > 0 ? (
						<span>
              {currentFrame + 1} of {timelineFrames.length} frames | {timelineFrames[currentFrame]?.length || 0} pixels
            </span>
					) : (
						<span>No timelapse data available</span>
					)}
				</div>
			</div>

			<div className="timelapse-canvas-container">
				<canvas ref={canvasRef} className="timelapse-canvas" />
				{timelineFrames.length === 0 && (
					<div className="timelapse-no-data">
						<p>Not enough pixel history data to generate a timelapse.</p>
					</div>
				)}
			</div>

			<div className="timelapse-controls">
				<div className="timelapse-timeline">
					<span className="timeline-timestamp">{formatTimestamp(0)}</span>
					<input
						type="range"
						min="0"
						max="100"
						value={progress}
						onChange={handleSeek}
						className="timeline-slider"
						disabled={timelineFrames.length <= 1}
					/>
					<span className="timeline-timestamp">{formatTimestamp(timelineFrames.length - 1)}</span>
				</div>

				<div className="timelapse-buttons">
					<Button
						variant="secondary"
						size="sm"
						onClick={handleReset}
						disabled={timelineFrames.length <= 1 || currentFrame === 0}
						className="timelapse-button"
					>
						Reset
					</Button>

					<Button
						variant="primary"
						size="sm"
						onClick={handlePlayPause}
						disabled={timelineFrames.length <= 1}
						className="timelapse-button"
					>
						{isPlaying ? 'Pause' : currentFrame === timelineFrames.length - 1 ? 'Restart' : 'Play'}
					</Button>

					<div className="speed-controls">
						<span>Speed:</span>
						<div className="speed-buttons">
							{[0.5, 1, 2, 5].map(speedMultiplier => (
								<button
									key={speedMultiplier}
									className={`speed-button ${speed === speedMultiplier ? 'active' : ''}`}
									onClick={() => handleSpeedChange(speedMultiplier)}
									disabled={timelineFrames.length <= 1}
								>
									{speedMultiplier}x
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="frame-info">
          <span>
            Showing pixel history from {pixelHistory.length > 0 ? new Date(pixelHistory[0].timestamp).toLocaleDateString() : 'N/A'} to {pixelHistory.length > 0 ? new Date(pixelHistory[pixelHistory.length - 1].timestamp).toLocaleDateString() : 'N/A'}
          </span>
				</div>
			</div>
		</div>
	);
};

export default BoardTimelapse;
