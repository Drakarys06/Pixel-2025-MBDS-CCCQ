import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import PixelTooltip from '../ui/PixelTooltip';
import { useTheme } from '../ui/ThemeContext';
import '../../styles/ui/PixelGrid.css';

interface Pixel {
	_id: string;
	x: number;
	y: number;
	color: string;
	lastModifiedDate: string;
	modifiedBy: string[];
	boardId: string;
	modificationCount?: number;
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
	const { theme } = useTheme(); // Obtenir le thème actuel
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

	// Extract pixel coordinate calculation to a reusable function
	const getPixelCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return null;

		const rect = canvasRef.current.getBoundingClientRect();
		return {
			x: Math.floor((e.clientX - rect.left) / cellSize),
			y: Math.floor((e.clientY - rect.top) / cellSize)
		};
	}, [cellSize]);

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
				// Utiliser le champ modificationCount ou défaut à 1
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

		// Mettre à jour la valeur maximale pour la légende externe
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

		// Adapter la légende au thème actuel
		const bgColor = theme === 'dark' ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.8)';
		const textColor = theme === 'dark' ? '#fff' : '#000';
		const borderColor = theme === 'dark' ? '#555' : '#000';

		// Draw background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, legendWidth, legendHeight);
		ctx.strokeStyle = borderColor;
		ctx.strokeRect(0, 0, legendWidth, legendHeight);

		// Draw gradient
		const gradientWidth = legendWidth - 60;
		for (let i = 0; i < gradientWidth; i++) {
			const normalizedValue = i / gradientWidth;
			ctx.fillStyle = getHeatmapColor(normalizedValue * maxHeatmapValue, maxHeatmapValue);
			ctx.fillRect(30 + i, 10, 1, 10);
		}

		// Add text
		ctx.fillStyle = textColor;
		ctx.font = '10px Arial';
		ctx.textAlign = 'left';
		ctx.fillText('Low', 10, 16);
		ctx.textAlign = 'right';
		ctx.fillText('High', legendWidth - 10, 16);
		ctx.textAlign = 'center';
		ctx.fillText(`(max: ${maxHeatmapValue})`, legendWidth / 2, 30);

	}, [showHeatmap, maxHeatmapValue, getHeatmapColor, theme]);

	// Handle drawing the pixel grid
	useEffect(() => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

		// Si on est en mode heatmap, on dessine différemment
		if (showHeatmap) {
			// Remplir tout le canvas avec la couleur de fond gris clair pour le mode heatmap
			ctx.fillStyle = '#f0f0f0';
			ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

			// Dessiner la heatmap
			const { heatmapData, maxValue } = calculateHeatmap();

			// Draw heatmap cells
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const value = heatmapData[y][x];
					if (value > 0) {
						const heatmapColor = getHeatmapColor(value, maxValue);
						ctx.fillStyle = heatmapColor;
						ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

						// Add text to show the exact number of modifications for each pixel
						if (cellSize > 15) {  // Only show numbers if cells are big enough
							const rgbMatch = heatmapColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
							let textColor = 'black';

							if (rgbMatch) {
								const r = parseInt(rgbMatch[1], 10);
								const g = parseInt(rgbMatch[2], 10);
								const b = parseInt(rgbMatch[3], 10);
								const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
								textColor = luminance < 140 ? 'white' : 'black';
							}

							ctx.fillStyle = textColor;
							ctx.font = `${Math.min(12, cellSize / 2)}px Arial`;
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
		} else {
			// Mode normal (non-heatmap) - PAS de fond gris, seulement les pixels et éventuellement la grille

			// Dessiner les pixels placés
			pixels.forEach(pixel => {
				ctx.fillStyle = pixel.color;
				ctx.fillRect(pixel.x * cellSize, pixel.y * cellSize, cellSize, cellSize);
			});

			// Ensuite, si showGridLines est actif, dessiner les diagonales et lignes de grille
			if (showGridLines) {
				ctx.strokeStyle = '#ccc'; // Couleur pour les lignes diagonales et grille
				ctx.lineWidth = 1;

				// Remplir les cellules vides en gris clair et dessiner une diagonale
				for (let x = 0; x < width; x++) {
					for (let y = 0; y < height; y++) {
						const pixelExists = pixels.some(pixel => pixel.x === x && pixel.y === y);
						if (!pixelExists) {
							// Fill empty cell with light grey
							ctx.fillStyle = '#f0f0f0';
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

							// Draw just one diagonal line (top-left to bottom-right)
							ctx.beginPath();
							ctx.moveTo(x * cellSize, y * cellSize);
							ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize);
							ctx.stroke();
						}
					}
				}

				// Draw the grid lines after all the cells
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
			}
		}
	}, [pixels, cellSize, canvasSize, width, height, showGridLines, showHeatmap, calculateHeatmap, theme]);

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

	// Handle canvas click
	const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current || !editable || loading || showHeatmap) return; // Prevent placing pixels in heatmap mode

		const coords = getPixelCoordinates(e);
		if (coords && onPixelClick) {
			onPixelClick(coords.x, coords.y);
		}
	}, [getPixelCoordinates, editable, loading, onPixelClick, showHeatmap]);

	// Handle mouse movement for tooltip
	const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;

		clearTooltipTimeout();

		const coords = getPixelCoordinates(e);
		if (!coords) return;

		const pixel = pixels.find(p => p.x === coords.x && p.y === coords.y);

		if (!pixel) {
			setTooltip(prev => ({ ...prev, visible: false }));
			return;
		}

		const formatDate = (dateString: string) => {
			const date = new Date(dateString);
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			return `${day}/${month}/${year} ${hours}:${minutes}`;
		};

		let tooltipContent = `(${pixel.x}, ${pixel.y})`;

		// En mode heatmap, montrer les statistiques en premier
		if (showHeatmap) {
			tooltipContent += `\nModifications: ${pixel.modificationCount || 1}`;
			tooltipContent += `\nUtilisateurs uniques: ${new Set(pixel.modifiedBy).size}`;
			tooltipContent += `\nCouleur actuelle: ${pixel.color}`;
			tooltipContent += `\nDernière modification: ${formatDate(pixel.lastModifiedDate)}`;
		} else {
			// En mode normal, priorité à la couleur et aux informations standard
			tooltipContent += `\nCouleur: ${pixel.color}`;
			tooltipContent += `\n${formatDate(pixel.lastModifiedDate)}`;
			// Compter le nombre d'utilisateurs uniques
			const uniqueUsers = new Set(pixel.modifiedBy);
			tooltipContent += `\nPar: ${Array.from(uniqueUsers).join(', ')}`;
		}

		tooltipTimeoutRef.current = window.setTimeout(() => {
			setTooltip({
				visible: true,
				x: e.clientX,
				y: e.clientY,
				content: tooltipContent,
				width: 0,
				height: 0
			});
		}, 300);
	}, [getPixelCoordinates, pixels, clearTooltipTimeout, showHeatmap]);

	// Handle mouse leaving the canvas
	const handleCanvasMouseLeave = useCallback(() => {
		clearTooltipTimeout();
		setTooltip(prev => ({ ...prev, visible: false }));
	}, [clearTooltipTimeout]);

	return (
		<div ref={wrapperRef} className={`pixel-grid-wrapper ${className}`}>
			<canvas
				ref={canvasRef}
				width={canvasSize.width}
				height={canvasSize.height}
				style={{
					border: `2px solid ${theme === 'dark' ? '#555' : '#000'}`,
					cursor: editable && !loading && !showHeatmap ? 'pointer' : 'default'
				}}
				onClick={handleCanvasClick}
				onMouseMove={handleCanvasMouseMove}
				onMouseLeave={handleCanvasMouseLeave}
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
