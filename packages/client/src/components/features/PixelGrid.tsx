import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import PixelTooltip from '../ui/PixelTooltip';
import { useAuth } from '../auth/AuthContext';
import usePermissions from '../auth/usePermissions';
import '../../styles/ui/PixelGrid.css';

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

interface PixelGridProps {
	width: number;
	height: number;
	pixels: Pixel[];
	editable?: boolean;
	onPixelClick?: (x: number, y: number) => void;
	className?: string;
	loading?: boolean;
	showGridLines?: boolean;
	showHeatmap?: boolean;
}

export interface PixelGridRef {
	getCanvas: () => HTMLCanvasElement | null;
	exportCanvas: () => HTMLCanvasElement;
	getPixelData: () => Pixel[];
}

interface TooltipState {
	visible: boolean;
	x: number;
	y: number;
	content: string;
	width: number;
	height: number;
}
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PixelGrid = forwardRef<PixelGridRef, PixelGridProps>(({
	width,
	height,
	pixels,
	editable = true,
	onPixelClick,
	className = '',
	loading = false,
	showGridLines = false,
	showHeatmap = false
}, ref) => {
	const { currentUser, isGuestMode } = useAuth();
	const permissions = usePermissions();
	const canCreatePixel = useCallback(() => {
		return permissions.canCreatePixel();
	}, [permissions, currentUser, isGuestMode]);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const legendCanvasRef = useRef<HTMLCanvasElement>(null);
	const tooltipTimeoutRef = useRef<number | null>(null);
	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const [cellSize, setCellSize] = useState(25);
	const [maxHeatmapValue, setMaxHeatmapValue] = useState(1);
	const [tooltip, setTooltip] = useState<TooltipState>({
		visible: false,
		x: 0,
		y: 0,
		content: '',
		width: 0,
		height: 0
	});

	// New state variables for zoom and pan
	const [zoomLevel, setZoomLevel] = useState<number>(1);
	const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState<boolean>(false);
	const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
	const [lastClickTime, setLastClickTime] = useState<number>(0);

	// Extract pixel coordinate calculation to a reusable function
	const getPixelCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return null;

		const rect = canvasRef.current.getBoundingClientRect();
		// Adjust for zoom level and pan position
		const adjustedX = (e.clientX - rect.left - pan.x) / zoomLevel;
		const adjustedY = (e.clientY - rect.top - pan.y) / zoomLevel;
		
		return {
			x: Math.floor(adjustedX / cellSize),
			y: Math.floor(adjustedY / cellSize)
		};
	}, [cellSize, zoomLevel, pan]);

	// Get color for heatmap based on value
	const getHeatmapColor = (value: number, maxValue: number): string => {
		// Normalize value to be between 0 and 1
		const normalizedValue = Math.min(value / maxValue, 1);

		// Utiliser une fonction d'échelle logarithmique pour mieux distribuer les couleurs
		const enhancedValue = Math.pow(normalizedValue, 0.7);

		// Définir les palettes de couleurs
		const colors = [
			[0, 0, 255],      // Bleu
			[0, 128, 255],    // Bleu ciel
			[0, 255, 255],    // Cyan
			[0, 255, 128],    // Vert-cyan
			[0, 255, 0],      // Vert
			[128, 255, 0],    // Vert-jaune
			[255, 255, 0],    // Jaune
			[255, 128, 0],    // Orange
			[255, 0, 0]       // Rouge
		];

		// Déterminer l'index du segment de couleur
		const segments = colors.length - 1;
		const position = enhancedValue * segments;
		const index = Math.min(Math.floor(position), segments - 1);
		const fraction = position - index;

		// Interpoler entre les couleurs adjacentes
		const color1 = colors[index];
		const color2 = colors[index + 1];

		const r = Math.round(color1[0] + fraction * (color2[0] - color1[0]));
		const g = Math.round(color1[1] + fraction * (color2[1] - color1[1]));
		const b = Math.round(color1[2] + fraction * (color2[2] - color1[2]));

		return `rgb(${r}, ${g}, ${b})`;
	};

	// Calculate heatmap data
	const calculateHeatmap = useCallback(() => {
		// Create a 2D array to store the frequency of modifications for each pixel
		const heatmapData: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));

		// Count the number of modifications for each pixel
		pixels.forEach(pixel => {
			if (pixel.x >= 0 && pixel.x < width && pixel.y >= 0 && pixel.y < height) {
				heatmapData[pixel.y][pixel.x] = pixel.modificationCount || 1;
			}
		});

		// Find the maximum value to normalize the heatmap
		let maxValue = 1; // Default to 1 to avoid division by zero
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				maxValue = Math.max(maxValue, heatmapData[y][x]);
			}
		}

		setMaxHeatmapValue(maxValue);
		return { heatmapData, maxValue };
	}, [pixels, width, height]);

	// Handle canvas resizing
	useEffect(() => {
		const handleResize = () => {
			if (wrapperRef.current) {
				const { clientWidth, clientHeight } = wrapperRef.current;
				const aspectRatio = width / height;
				let newWidth = clientWidth;
				let newHeight = clientHeight;

				if (clientWidth / clientHeight > aspectRatio) {
					newWidth = clientHeight * aspectRatio;
				} else {
					newHeight = clientWidth / aspectRatio;
				}

				setCanvasSize({ width: newWidth, height: newHeight });
				setCellSize(Math.min(newWidth / width, newHeight / height));
			}
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			if (tooltipTimeoutRef.current !== null) {
				window.clearTimeout(tooltipTimeoutRef.current);
			}
		};
	}, [width, height]);

	// Draw the legend outside of the main canvas
	useEffect(() => {
		if (!legendCanvasRef.current || !showHeatmap) return;

		const ctx = legendCanvasRef.current.getContext('2d');
		if (!ctx) return;

		const legendWidth = legendCanvasRef.current.width;
		const legendHeight = legendCanvasRef.current.height;

		// Clear the canvas
		ctx.clearRect(0, 0, legendWidth, legendHeight);

		// Draw background
		ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
		ctx.fillRect(0, 0, legendWidth, legendHeight);
		ctx.strokeStyle = '#000';
		ctx.strokeRect(0, 0, legendWidth, legendHeight);

		// Draw gradient
		const gradientWidth = legendWidth - 60;
		for (let i = 0; i < gradientWidth; i++) {
			const normalizedValue = i / gradientWidth;
			ctx.fillStyle = getHeatmapColor(normalizedValue * maxHeatmapValue, maxHeatmapValue);
			ctx.fillRect(30 + i, 10, 1, 10);
		}

		// Add text
		ctx.fillStyle = '#000';
		ctx.font = '10px Arial';
		ctx.textAlign = 'left';
		ctx.fillText('Low', 10, 16);
		ctx.textAlign = 'right';
		ctx.fillText('High', legendWidth - 10, 16);
		ctx.textAlign = 'center';
		ctx.fillText(`(max: ${maxHeatmapValue})`, legendWidth / 2, 30);

	}, [showHeatmap, maxHeatmapValue, getHeatmapColor]);

	// Handle drawing the pixel grid
	useEffect(() => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		// Apply transformation for zoom and pan
		ctx.save();
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		ctx.translate(pan.x, pan.y);
		ctx.scale(zoomLevel, zoomLevel);

		// Si mode heatmap, on ne dessine pas les pixels normaux d'abord
		if (!showHeatmap) {
			// Draw regular pixels (only in normal mode)
			pixels.forEach(pixel => {
				ctx.fillStyle = pixel.color;
				ctx.fillRect(pixel.x * cellSize, pixel.y * cellSize, cellSize, cellSize);
			});
		}

		// Draw empty cells and/or grid lines if needed
		if (showGridLines || showHeatmap) {
			ctx.fillStyle = '#f0f0f0';
			for (let x = 0; x < width; x++) {
				for (let y = 0; y < height; y++) {
					const pixelExists = pixels.some(pixel => pixel.x === x && pixel.y === y);
					if (!pixelExists || showHeatmap) {
						ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
					}
				}
			}

			// Draw grid lines
			if (showGridLines) {
				ctx.strokeStyle = '#ccc';
				ctx.lineWidth = 1 / zoomLevel; // Adjust line width based on zoom
				for (let x = 0; x <= width; x++) {
					ctx.beginPath();
					ctx.moveTo(x * cellSize, 0);
					ctx.lineTo(x * cellSize, height * cellSize);
					ctx.stroke();
				}
				for (let y = 0; y <= height; y++) {
					ctx.beginPath();
					ctx.moveTo(0, y * cellSize);
					ctx.lineTo(width * cellSize, y * cellSize);
					ctx.stroke();
				}

				// Draw diagonal lines
				ctx.strokeStyle = '#ddd';
				for (let x = 0; x < width; x++) {
					for (let y = 0; y < height; y++) {
						const pixelExists = pixels.some(pixel => pixel.x === x && pixel.y === y);
						if (!pixelExists) {
							ctx.beginPath();
							ctx.moveTo(x * cellSize, y * cellSize);
							ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize);
							ctx.stroke();

							ctx.beginPath();
							ctx.moveTo((x + 1) * cellSize, y * cellSize);
							ctx.lineTo(x * cellSize, (y + 1) * cellSize);
							ctx.stroke();
						}
					}
				}
			}
		}

		// Draw heatmap if enabled
		if (showHeatmap) {
			const { heatmapData, maxValue } = calculateHeatmap();

			// Draw heatmap cells (completely replacing the original colors)
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const value = heatmapData[y][x];
					if (value > 0) {
						// Utiliser une couleur pleine (non transparente) pour remplacer complètement la couleur d'origine
						const heatmapColor = getHeatmapColor(value, maxValue);
						ctx.fillStyle = heatmapColor;
						ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

						// Add text to show the exact number of modifications for each pixel
						if (cellSize * zoomLevel > 15) {  // Only show numbers if cells are big enough
							const rgbMatch = heatmapColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

							let textColor = 'black'; // Défaut à noir

							if (rgbMatch) {
								// Formule de luminance perçue (Rec. 709)
								const r = parseInt(rgbMatch[1], 10);
								const g = parseInt(rgbMatch[2], 10);
								const b = parseInt(rgbMatch[3], 10);

								// Calculer la luminance (valeur entre 0 et 255)
								const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

								// Si la luminance est inférieure à 140 (sur 255), utiliser du texte blanc, sinon noir
								textColor = luminance < 140 ? 'white' : 'black';
							}

							ctx.fillStyle = textColor;
							ctx.font = `${Math.min(12, cellSize * zoomLevel / 2)}px Arial`;
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';
							ctx.fillText(
								value.toString(),
								x * cellSize + cellSize / 2,
								y * cellSize + cellSize / 2
							);
						}
					}
				}
			}
		}

		// Draw a border around the entire grid
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 3 / zoomLevel; // Make the border thicker but scale with zoom
		ctx.strokeRect(0, 0, width * cellSize, height * cellSize);

		// Restore context to clear transformations
		ctx.restore();
	}, [pixels, cellSize, canvasSize, width, height, showGridLines, showHeatmap, calculateHeatmap, getHeatmapColor, zoomLevel, pan]);

	// Handle tooltip size changes
	const handleTooltipSizeChange = useCallback((width: number, height: number) => {
		setTooltip(prev => ({
			...prev,
			width,
			height
		}));
	}, []);

	// Clear tooltip timeout
	const clearTooltipTimeout = useCallback(() => {
		if (tooltipTimeoutRef.current !== null) {
			window.clearTimeout(tooltipTimeoutRef.current);
			tooltipTimeoutRef.current = null;
		}
	}, []);

	// Expose canvas element for external use (exporting)
	useImperativeHandle(ref, () => ({
		getCanvas: () => canvasRef.current,
		exportCanvas: () => {
			// Create a clean canvas for export without grid lines or heatmap
			const exportCanvas = document.createElement('canvas');
			exportCanvas.width = width;
			exportCanvas.height = height;
			const ctx = exportCanvas.getContext('2d');

			if (ctx) {
				// Clear canvas
				ctx.clearRect(0, 0, width, height);

				// Draw only the pixels (no grid lines or empty cells)
				pixels.forEach(pixel => {
					ctx.fillStyle = pixel.color;
					ctx.fillRect(pixel.x, pixel.y, 1, 1);
				});
			}

			return exportCanvas;
		},
		getPixelData: () => pixels
	}));

	// Handle mouse down for panning
	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (e.button === 2) { // Right mouse button for panning
			setDragStart({ x: e.clientX, y: e.clientY });
			setIsPanning(true);
		}
	}, []);

	// Handle mouse move for panning with boundary constraints
	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		// Handle panning when mouse is down
		if (isPanning && dragStart && canvasRef.current) {
			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;
			
			// Calculate the bounds to keep at least 25% of the canvas in view
			const canvasWidth = canvasRef.current.width;
			const canvasHeight = canvasRef.current.height;
			const gridWidth = width * cellSize * zoomLevel;
			const gridHeight = height * cellSize * zoomLevel;
			
			// Calculate new pan position
			const newPanX = pan.x + dx;
			const newPanY = pan.y + dy;
			
			// Apply constraints to keep grid partially visible
			const minX = -gridWidth + canvasWidth * 0.25;
			const maxX = canvasWidth * 0.75;
			const minY = -gridHeight + canvasHeight * 0.25;
			const maxY = canvasHeight * 0.75;
			
			// Apply constrained pan
			setPan({
				x: Math.min(Math.max(newPanX, minX), maxX),
				y: Math.min(Math.max(newPanY, minY), maxY)
			});
			
			setDragStart({ x: e.clientX, y: e.clientY });
		}
	}, [isPanning, dragStart, canvasRef, pan, width, height, cellSize, zoomLevel]);

	// Handle mouse up to stop panning
	const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		// For right button release (panning)
		if (e.button === 2) {
			setIsPanning(false);
			setDragStart(null);
		}
		// For left button release (pixel placement)
		else if (e.button === 0) {
			// Place pixel only if it's a valid position
			if (canvasRef.current && !loading && !showHeatmap && canCreatePixel() && editable) {
				// Get the pixel coordinates and place a pixel
				const coords = getPixelCoordinates(e);
				if (coords && onPixelClick && coords.x >= 0 && coords.x < width && coords.y >= 0 && coords.y < height) {
					onPixelClick(coords.x, coords.y);
				}
			}
		}
	}, [canvasRef, loading, showHeatmap, canCreatePixel, editable, getPixelCoordinates, onPixelClick, width, height]);

	// Handle zoom in
	const handleZoomIn = useCallback(() => {
		setZoomLevel(prev => {
			const newZoom = Math.min(prev * 1.2, 50); // Limit max zoom to 5x
			// Adjust pan to maintain center when zooming
			if (canvasRef.current) {
				const centerX = canvasRef.current.width / 2;
				const centerY = canvasRef.current.height / 2;
				// Adjust pan to keep the center point stable
				setPan(prevPan => ({
					x: centerX - ((centerX - prevPan.x) * (newZoom / prev)),
					y: centerY - ((centerY - prevPan.y) * (newZoom / prev))
				}));
			}
			return newZoom;
		});
	}, [canvasRef]);

	// Handle zoom out
	const handleZoomOut = useCallback(() => {
		setZoomLevel(prev => {
			const newZoom = Math.max(prev / 1.2, 0.5); // Limit min zoom to 0.5x
			// Adjust pan to maintain center when zooming
			if (canvasRef.current) {
				const centerX = canvasRef.current.width / 2;
				const centerY = canvasRef.current.height / 2;
				// Adjust pan to keep the center point stable
				setPan(prevPan => ({
					x: centerX - ((centerX - prevPan.x) * (newZoom / prev)),
					y: centerY - ((centerY - prevPan.y) * (newZoom / prev))
				}));
			}
			return newZoom;
		});
	}, [canvasRef]);

	// Handle reset zoom and pan
	const handleResetView = useCallback(() => {
		setZoomLevel(1);
		setPan({ x: 0, y: 0 });
		// Also reset any panning state
		setIsPanning(false);
		setDragStart(null);
	}, []);

	// Handle canvas mouse movement for tooltip
	// Inside PixelGrid.tsx, modify the handleCanvasMouseMove function:

	const handleCanvasTooltipMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current || isPanning) return;

		clearTooltipTimeout();

		const coords = getPixelCoordinates(e);
		if (!coords || coords.x < 0 || coords.x >= width || coords.y < 0 || coords.y >= height) {
			setTooltip(prev => ({ ...prev, visible: false }));
			return;
		}

		const pixel = pixels.find(p => p.x === coords.x && p.y === coords.y);

		if (!pixel) {
			setTooltip(prev => ({ ...prev, visible: false }));
			return;
		}

		const formatGuestUsername = (userId: string, username?: string): string => {
			if (userId.startsWith('guest-')) {
			  const guestNumber = userId.substring(6, 11);
			  return `Guest-${guestNumber}`;
			}
			return username || userId;
		  };

		const formatDate = (dateString: string) => {
			const date = new Date(dateString);
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			return `${day}/${month}/${year} ${hours}:${minutes}`;
		};

		// Fetch the board to get contributor information
		const fetchContributors = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`${API_URL}/api/pixels/board/${pixel.boardId}/contributors`, {
					headers: {
						'Authorization': token ? `Bearer ${token}` : ''
					}
				});

				if (response.ok) {
					const contributors = await response.json();

					// Create a map of userIds to usernames
					const userMap = contributors.reduce((map, contributor) => {
						map[contributor.userId] = contributor.username;
						return map;
					}, {});

					// Format tooltip content with usernames
					let tooltipContent = `(${pixel.x}, ${pixel.y})`;

					// In heatmap mode, show statistics first
					if (showHeatmap) {
						tooltipContent += `\nModifications: ${pixel.modificationCount || 1}`;
						tooltipContent += `\nUnique users: ${new Set(pixel.modifiedBy).size}`;
						tooltipContent += `\nCurrent color: ${pixel.color}`;
						tooltipContent += `\nLast modified: ${formatDate(pixel.lastModifiedDate)}`;
					} else {
						// In normal mode, prioritize color and standard information
						tooltipContent += `\nColor: ${pixel.color}`;
						tooltipContent += `\n${formatDate(pixel.lastModifiedDate)}`;

						// Format contributors with usernames instead of IDs
						const usernames = pixel.modifiedBy.map(userId => {
							const formattedId = formatGuestUsername(userId);

							return userMap[userId] || formattedId;
						});
						const uniqueUsernames = [...new Set(usernames)];
						tooltipContent += `\nBy: ${uniqueUsernames.join(', ')}`;
					}

					setTooltip({
						visible: true,
						x: e.clientX,
						y: e.clientY,
						content: tooltipContent,
						width: 0,
						height: 0
					});
				}
			} catch (error) {
				console.error('Error fetching contributors for tooltip:', error);

				// Fallback to IDs if we can't fetch usernames
				let tooltipContent = `(${pixel.x}, ${pixel.y})`;
				tooltipContent += `\nColor: ${pixel.color}`;
				tooltipContent += `\n${formatDate(pixel.lastModifiedDate)}`;

				const formattedUsernames = pixel.modifiedBy.map(userId => {
					if (userId.startsWith('guest-')) {
					  const guestNumber = userId.substring(6, 11);
					  return `Guest-${guestNumber}`;
					}
					return userId;
				  });

				tooltipContent += `\nBy: ${Array.from(new Set(formattedUsernames)).join(', ')}`;

				setTooltip({
					visible: true,
					x: e.clientX,
					y: e.clientY,
					content: tooltipContent,
					width: 0,
					height: 0
				});
			}
		};

		// Show a simple tooltip immediately while the full one loads
		setTooltip({
			visible: true,
			x: e.clientX,
			y: e.clientY,
			content: `(${pixel.x}, ${pixel.y})\nLoading details...`,
			width: 0,
			height: 0
		});

		// Clear any existing timeout and set a new one
		tooltipTimeoutRef.current = window.setTimeout(() => {
			fetchContributors();
		}, 100);
	}, [getPixelCoordinates, pixels, clearTooltipTimeout, showHeatmap, API_URL, isPanning]);

	// Handle mouse leaving the canvas
	const handleCanvasMouseLeave = useCallback(() => {
		clearTooltipTimeout();
		setTooltip(prev => ({ ...prev, visible: false }));
		setIsPanning(false);
		setDragStart(null);
	}, [clearTooltipTimeout]);

	// Use a useEffect to add a non-passive wheel event listener
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		
		// Function to handle wheel events with non-passive listener
		const wheelHandler = (e: WheelEvent) => {
			e.preventDefault();
			
			// Get mouse position relative to canvas
			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			
			// Calculate position in the grid coordinates before zoom
			const gridX = (mouseX - pan.x) / zoomLevel;
			const gridY = (mouseY - pan.y) / zoomLevel;
			
			// Determine zoom direction and calculate new zoom level
			const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // Zoom in or out
			const newZoomLevel = Math.min(Math.max(zoomLevel * zoomFactor, 0.5), 50); // Limit zoom between 0.5x and 5x
			
			// Update zoom level
			setZoomLevel(newZoomLevel);
			
			// Calculate new pan to keep the point under the mouse in the same position
			const newPanX = mouseX - gridX * newZoomLevel;
			const newPanY = mouseY - gridY * newZoomLevel;
			
			// Apply the new pan
			setPan({
				x: newPanX,
				y: newPanY
			});
		};
		
		// Add wheel event with the { passive: false } option
		canvas.addEventListener('wheel', wheelHandler, { passive: false });
		
		// Clean up
		return () => {
			canvas.removeEventListener('wheel', wheelHandler);
		};
	}, [zoomLevel, pan]);

	// Prevent context menu
	const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		e.preventDefault();
		return false;
	}, []);

	// Déterminer le curseur à afficher
	const getCursor = () => {
		if (loading) return 'wait';
		if (showHeatmap) return 'default';
		if (isPanning) return 'grabbing';
		if (!editable) return 'not-allowed';
		if (!canCreatePixel()) return 'not-allowed';
		return 'pointer';
	};

	return (
		<div ref={wrapperRef} className={`pixel-grid-wrapper ${className}`}>
			{/* Zoom controls */}
			<div className="zoom-controls">
				<button 
					className="zoom-button" 
					onClick={handleZoomIn} 
					title="Zoom In"
				>
					+
				</button>
				<button 
					className="zoom-button" 
					onClick={handleZoomOut} 
					title="Zoom Out"
				>
					-
				</button>
				<button 
					className="zoom-button reset-button" 
					onClick={handleResetView} 
					title="Reset View"
				>
					↺
				</button>
				<div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
			</div>
			
			<canvas
				ref={canvasRef}
				width={canvasSize.width}
				height={canvasSize.height}
				style={{
					border: '2px solid black',
					cursor: getCursor()
				}}
				onMouseDown={handleMouseDown}
				onMouseMove={(e) => {
					handleMouseMove(e);
					handleCanvasTooltipMove(e);
				}}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleCanvasMouseLeave}
				onContextMenu={handleContextMenu}
			/>

			{/* Légende de heatmap externe */}
			{showHeatmap && (
				<div className="heatmap-legend-container">
					<canvas
						ref={legendCanvasRef}
						width={200}
						height={40}
						className="heatmap-legend"
					/>
				</div>
			)}

			{loading && (
				<div className="pixel-grid-loading-overlay">
					<div className="pixel-grid-spinner"></div>
				</div>
			)}

			{/* Message quand l'utilisateur n'a pas la permission de placer des pixels */}
			{!canCreatePixel && !showHeatmap && editable && (
				<div className="pixel-grid-permission-overlay">
					<div className="permission-message">
						You don't have permission to place pixels. Please log in or request access.
					</div>
				</div>
			)}

			<PixelTooltip
				visible={tooltip.visible}
				content={tooltip.content}
				x={tooltip.x}
				y={tooltip.y}
				onSizeChange={handleTooltipSizeChange}
			/>
		</div>
	);
});

export default PixelGrid;