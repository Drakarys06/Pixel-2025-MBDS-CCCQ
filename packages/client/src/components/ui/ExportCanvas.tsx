import React, { useState, useRef, useEffect } from 'react';
import '../../styles/ui/ExportCanvas.css';
import Button from './Button';
import { PixelGridRef } from '../features/PixelGrid';

interface ExportCanvasProps {
	getCanvasData: () => HTMLCanvasElement | null;
	pixelGridRef?: React.RefObject<PixelGridRef | null>;
	boardWidth: number;
	boardHeight: number;
	className?: string;
}

const ExportCanvas: React.FC<ExportCanvasProps> = ({
	getCanvasData,
	pixelGridRef,
	boardWidth,
	boardHeight,
	className = ''
}) => {
	const [exportType, setExportType] = useState<'png' | 'svg'>('png');
	const [customSize, setCustomSize] = useState(false);
	const [width, setWidth] = useState(boardWidth);
	const [height, setHeight] = useState(boardHeight);
	const [transparent, setTransparent] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);
	const [pixels, setPixels] = useState<any[]>([]);

	// When export type changes, reset custom size for PNG
	useEffect(() => {
		if (exportType === 'png' && customSize) {
			setCustomSize(false);
			setWidth(boardWidth);
			setHeight(boardHeight);
		}
	}, [exportType, boardWidth, boardHeight, customSize]);

	// Handle clicks outside the dialog to close it
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	// When dialog opens, update the pixel data
	useEffect(() => {
		if (isOpen && pixelGridRef?.current) {
			// If we're using the PixelGrid component directly, access its pixels
			setPixels(pixelGridRef.current.getPixelData());
		}
	}, [isOpen, pixelGridRef]);

	// Handle width change with aspect ratio preservation
	const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (exportType !== 'svg') return; // Only allow sizing for SVG

		const newWidth = parseInt(e.target.value, 10) || 0;
		setWidth(newWidth);

		if (!customSize) return;

		// Preserve aspect ratio
		const aspectRatio = boardWidth / boardHeight;
		setHeight(Math.round(newWidth / aspectRatio));
	};

	// Handle height change with aspect ratio preservation
	const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (exportType !== 'svg') return; // Only allow sizing for SVG

		const newHeight = parseInt(e.target.value, 10) || 0;
		setHeight(newHeight);

		if (!customSize) return;

		// Preserve aspect ratio
		const aspectRatio = boardWidth / boardHeight;
		setWidth(Math.round(newHeight * aspectRatio));
	};

	// Toggle custom size
	const handleCustomSizeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (exportType !== 'svg') return; // Only allow custom sizing for SVG

		const useCustomSize = e.target.checked;
		setCustomSize(useCustomSize);

		if (!useCustomSize) {
			setWidth(boardWidth);
			setHeight(boardHeight);
		}
	};

	// Export canvas as PNG
	const exportAsPNG = () => {
		// PNG exports always use original dimensions
		setCustomSize(false);

		// Use the export-specific canvas if available
		let canvas;
		if (pixelGridRef?.current) {
			canvas = pixelGridRef.current.exportCanvas();
		} else {
			canvas = getCanvasData();
			if (!canvas) return;
		}

		// Create a new canvas with the desired dimensions
		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = width;
		exportCanvas.height = height;
		const ctx = exportCanvas.getContext('2d');

		if (!ctx) return;

		// Fill background if not transparent
		if (!transparent) {
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, width, height);
		}

		// Draw the original canvas content scaled to the new dimensions
		ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);

		// Create download link
		const link = document.createElement('a');
		link.download = `pixel-board-${new Date().toISOString().slice(0, 10)}.png`;
		link.href = exportCanvas.toDataURL('image/png');
		link.click();

		// Close the export dialog
		setIsOpen(false);
	};

	// Export canvas as SVG
	const exportAsSVG = () => {
		// Create SVG content
		let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boardWidth} ${boardHeight}" width="${width}" height="${height}">`;

		// Add background if not transparent
		if (!transparent) {
			svgContent += `<rect width="${boardWidth}" height="${boardHeight}" fill="white"/>`;
		}

		// Directly use pixel data from our array
		pixels.forEach(pixel => {
			const pixelColor = pixel.color;
			svgContent += `<rect x="${pixel.x}" y="${pixel.y}" width="1" height="1" fill="${pixelColor}"/>`;
		});

		svgContent += '</svg>';

		// Create download link
		const blob = new Blob([svgContent], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.download = `pixel-board-${new Date().toISOString().slice(0, 10)}.svg`;
		link.href = url;
		link.click();

		// Cleanup
		URL.revokeObjectURL(url);
		setIsOpen(false);
	};

	// Handle export button click
	const handleExport = () => {
		if (exportType === 'png') {
			exportAsPNG();
		} else {
			exportAsSVG();
		}
	};

	const containerClasses = ['export-canvas-container', className].filter(Boolean).join(' ');

	return (
		<div className={containerClasses}>
			<Button
				variant="secondary"
				onClick={() => setIsOpen(true)}
				className="export-button"
			>
				Export Canvas
			</Button>

			{isOpen && (
				<div className="export-overlay">
					<div className="export-dialog" ref={dialogRef}>
						<div className="export-header">
							<h3>Export Canvas</h3>
							<button className="close-button" onClick={() => setIsOpen(false)}>×</button>
						</div>

						<div className="export-body">
							<div className="export-option">
								<label>Export Format</label>
								<div className="export-format-options">
									<label className={`format-option ${exportType === 'png' ? 'selected' : ''}`}>
										<input
											type="radio"
											name="exportType"
											value="png"
											checked={exportType === 'png'}
											onChange={() => setExportType('png')}
										/>
										PNG
									</label>
									<label className={`format-option ${exportType === 'svg' ? 'selected' : ''}`}>
										<input
											type="radio"
											name="exportType"
											value="svg"
											checked={exportType === 'svg'}
											onChange={() => setExportType('svg')}
										/>
										SVG
									</label>
								</div>
							</div>

							<div className="export-option">
								<label>
									<input
										type="checkbox"
										checked={transparent}
										onChange={(e) => setTransparent(e.target.checked)}
									/>
									Transparent Background
								</label>
							</div>

							<div className="export-option">
								<label className={exportType === 'png' ? 'disabled-option' : ''}>
									<input
										type="checkbox"
										checked={customSize}
										onChange={handleCustomSizeToggle}
										disabled={exportType === 'png'}
									/>
									Custom Size {exportType === 'png' && <span>(SVG only)</span>}
								</label>
							</div>

							<div className="export-dimensions">
								<div className="dimension-input">
									<label>Width</label>
									<input
										type="number"
										value={width}
										onChange={handleWidthChange}
										disabled={!customSize || exportType === 'png'}
										min={1}
									/>
								</div>
								<div className="dimension-input">
									<label>Height</label>
									<input
										type="number"
										value={height}
										onChange={handleHeightChange}
										disabled={!customSize || exportType === 'png'}
										min={1}
									/>
								</div>
							</div>

							<div className="info-text">
								{customSize ? (
									<p>Custom size will maintain the aspect ratio.</p>
								) : (
									<p>Original size: {boardWidth} × {boardHeight} pixels</p>
								)}
							</div>
						</div>

						<div className="export-footer">
							<Button
								variant="secondary"
								onClick={() => setIsOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="primary"
								onClick={handleExport}
							>
								Download
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ExportCanvas;