import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { Input, Checkbox, TimeInput } from '../ui/FormComponents';
import { useAuth } from '../auth/AuthContext';
import '../../styles/features/ImageToPixelBoard.css';

interface PixelData {
	x: number;
	y: number;
	color: string;
}

const ImageToPixelBoard: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [boardTitle, setBoardTitle] = useState<string>('');
	const [maxSize, setMaxSize] = useState<number>(32);
	const [pixelData, setPixelData] = useState<PixelData[]>([]);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [isCreatingBoard, setIsCreatingBoard] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [imageSize, setImageSize] = useState<{width: number, height: number}>({width: 0, height: 0});
	const [finalImageSize, setFinalImageSize] = useState<{width: number, height: number}>({width: 0, height: 0});

	// Board configuration options
	const [boardDurationSeconds, setBoardDurationSeconds] = useState<number>(30 * 24 * 60 * 60); // 30 days in seconds
	const [allowRedraw, setAllowRedraw] = useState<boolean>(true);
	const [enableVisitor, setEnableVisitor] = useState<boolean>(true);
	const [pixelCooldownSeconds, setPixelCooldownSeconds] = useState<number>(0); // seconds

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const { currentUser } = useAuth();
	const navigate = useNavigate();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Reset state when file changes
	useEffect(() => {
		if (selectedFile) {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target && typeof e.target.result === 'string') {
					setPreviewUrl(e.target.result);
					loadImageAndGetSize(e.target.result);
				}
			};
			reader.readAsDataURL(selectedFile);

			// Clear existing processing data when a new file is uploaded
			setPixelData([]);
			setMessage(null);
		} else {
			setPreviewUrl(null);
			setPixelData([]);
		}
	}, [selectedFile]);

	// Load image and get its dimensions
	const loadImageAndGetSize = (url: string) => {
		const img = new Image();
		img.onload = () => {
			setImageSize({
				width: img.width,
				height: img.height
			});

			// Auto-generate a title based on the file name if empty
			if (!boardTitle && selectedFile) {
				const baseName = selectedFile.name.split('.')[0];
				setBoardTitle(`${baseName} Pixel Board`);
			}

			// Store the image for later processing
			imageRef.current = img;

			// Automatically process the image twice when initially loaded
			setTimeout(() => {
				processImage();
				setTimeout(() => {
					processImage();
				}, 100);
			}, 100);
		};
		img.src = url;
	};

	// Handle file selection
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];

			// Validate file type
			if (!file.type.startsWith('image/')) {
				setError('Please select an image file');
				return;
			}

			setSelectedFile(file);
			setError(null);
		}
	};

	// Handle drag and drop
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];

			// Validate file type
			if (!file.type.startsWith('image/')) {
				setError('Please select an image file');
				return;
			}

			setSelectedFile(file);
			setError(null);
		}
	};

	// Handle max size change
	const handleMaxSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const size = parseInt(e.target.value);
		if (!isNaN(size) && size > 0 && size <= 100) {
			setMaxSize(size);
			// Automatically process the image when size changes
			if (imageRef.current) {
				processImage();
			}
		}
	};

	// Process image to extract pixel data
	const processImage = () => {
		if (!imageRef.current || !previewUrl) {
			setError('Please select an image first');
			return;
		}

		// Prevent re-processing if already in progress
		if (isProcessing) return;

		setIsProcessing(true);
		setError(null);

		try {
			const img = imageRef.current;

			if (!canvasRef.current) {
				setIsProcessing(false);
				setError('Canvas not available');
				return;
			}

			// Calculate scaled dimensions maintaining aspect ratio
			let scaledWidth, scaledHeight;
			if (img.width > img.height) {
				scaledWidth = maxSize;
				scaledHeight = Math.round((img.height / img.width) * maxSize);
			} else {
				scaledHeight = maxSize;
				scaledWidth = Math.round((img.width / img.height) * maxSize);
			}

			// Update final image size
			setFinalImageSize({width: scaledWidth, height: scaledHeight});

			// Set canvas size
			const canvas = canvasRef.current;
			canvas.width = scaledWidth;
			canvas.height = scaledHeight;

			// Draw scaled image
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				setIsProcessing(false);
				setError('Canvas context not available');
				return;
			}

			ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

			// Extract pixel data
			const pixels: PixelData[] = [];

			for (let y = 0; y < scaledHeight; y++) {
				for (let x = 0; x < scaledWidth; x++) {
					const imageData = ctx.getImageData(x, y, 1, 1).data;
					const r = imageData[0];
					const g = imageData[1];
					const b = imageData[2];
					const a = imageData[3];

					// Skip transparent pixels
					if (a === 0) continue;

					// Convert to hex color
					const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

					pixels.push({ x, y, color });
				}
			}

			setPixelData(pixels);
			setMessage(`Processed ${pixels.length} pixels (${scaledWidth}×${scaledHeight})`);
			renderPreview(pixels, scaledWidth, scaledHeight);
			setIsProcessing(false);
		} catch (err) {
			setIsProcessing(false);
			setError('Error processing image: ' + (err instanceof Error ? err.message : String(err)));
		}
	};

	// Render the preview of the pixelated image
	const renderPreview = (pixels: PixelData[], width: number, height: number) => {
		if (!previewCanvasRef.current) return;

		const canvas = previewCanvasRef.current;
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, width, height);

		// Draw pixels
		pixels.forEach(pixel => {
			ctx.fillStyle = pixel.color;
			ctx.fillRect(pixel.x, pixel.y, 1, 1);
		});
	};

	// Create pixel board
	const createPixelBoard = async () => {
		if (pixelData.length === 0) {
			setError('Please process the image first');
			return;
		}

		if (!boardTitle.trim()) {
			setError('Please enter a board title');
			return;
		}

		if (!currentUser) {
			setError('You must be logged in to create a board');
			return;
		}

		setIsCreatingBoard(true);
		setError(null);

		try {
			// 1. Create the board
			const token = localStorage.getItem('token');

			// Prepare board data - create the board initially WITHOUT cooldown
			const boardData = {
				title: boardTitle,
				width: finalImageSize.width,
				length: finalImageSize.height,
				time: Math.floor(boardDurationSeconds / 60), // Convert seconds to minutes for API
				redraw: allowRedraw,
				visitor: enableVisitor,
				cooldown: 0 // Initially set to zero to allow fast image import
			};

			console.log('Creating board temporarily without cooldown for image import');

			const boardResponse = await fetch(`${API_URL}/api/pixelboards`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token ? `Bearer ${token}` : ''
				},
				body: JSON.stringify(boardData)
			});

			if (!boardResponse.ok) {
				const errorData = await boardResponse.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to create board: ${boardResponse.status}`);
			}

			const board = await boardResponse.json();
			const boardId = board._id;

			console.log('Board created with ID:', boardId, 'and cooldown:', board.cooldown);

			// 2. Place all pixels
			// To avoid overwhelming the server, we'll place pixels in batches
			const BATCH_SIZE = 100; // Increased batch size since we have no cooldown initially
			let placedCount = 0;
			let failedCount = 0;
			const totalPixels = pixelData.length;

			for (let i = 0; i < pixelData.length; i += BATCH_SIZE) {
				const batch = pixelData.slice(i, i + BATCH_SIZE);

				// Prepare all pixel placements in current batch
				const pixelPromises = batch.map(async (pixel) => {
					try {
						const response = await fetch(`${API_URL}/api/pixels/board/${boardId}/place`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': token ? `Bearer ${token}` : ''
								// No special headers needed since cooldown is set to 0
							},
							body: JSON.stringify({
								x: pixel.x,
								y: pixel.y,
								color: pixel.color
							})
						});

						if (response.ok) {
							return true; // Success
						} else {
							console.warn(`Failed to place pixel at (${pixel.x}, ${pixel.y}): ${response.status}`);
							return false; // Failed
						}
					} catch (err) {
						console.error(`Error placing pixel at (${pixel.x}, ${pixel.y}):`, err);
						return false; // Failed
					}
				});

				// Wait for all pixel placements in this batch to complete
				const results = await Promise.all(pixelPromises);

				// Count successes and failures
				const batchSuccesses = results.filter(result => result).length;
				const batchFailures = results.filter(result => !result).length;

				placedCount += batchSuccesses;
				failedCount += batchFailures;

				// Update progress message
				const progressPercent = Math.round(((placedCount + failedCount) / totalPixels) * 100);
				setMessage(`Placed ${placedCount} of ${totalPixels} pixels (${progressPercent}%)...`);
			}

			// 3. Update the board with the desired cooldown if needed
			if (pixelCooldownSeconds > 0) {
				try {
					setMessage(`Setting board cooldown to ${pixelCooldownSeconds} seconds...`);

					const updateResponse = await fetch(`${API_URL}/api/pixelboards/${boardId}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': token ? `Bearer ${token}` : ''
						},
						body: JSON.stringify({
							cooldown: parseInt(String(pixelCooldownSeconds), 10)
						})
					});

					if (!updateResponse.ok) {
						console.warn('Failed to update board cooldown:', updateResponse.status);
					} else {
						console.log('Successfully set cooldown to', pixelCooldownSeconds, 'seconds');
					}
				} catch (updateErr) {
					console.error('Error setting cooldown:', updateErr);
				}
			}

			// 4. Navigate to the new board
			if (failedCount > 0) {
				setMessage(`Created board with ${placedCount} pixels! (${failedCount} failed) Redirecting...`);
			} else {
				setMessage(`Created board with ${placedCount} pixels! Redirecting...`);
			}

			setTimeout(() => {
				navigate(`/board/${boardId}`);
			}, 1500);

		} catch (err) {
			setError('Error creating pixel board: ' + (err instanceof Error ? err.message : String(err)));
			setIsCreatingBoard(false);
		}
	};

	return (
		<Layout title="Create Pixel Board from Image">
			<div className="image-converter-container">
				<Card className="upload-card">
					<div className="card-header">
						<h3>1. Upload and Process Image</h3>
					</div>
					<div className="card-body">
						<div
							className={`file-drop-area ${selectedFile ? 'has-file' : ''}`}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							<input
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="file-input"
								id="file-input"
							/>
							<label htmlFor="file-input" className="file-label">
								{selectedFile ? (
									<>
										<div className="selected-file-name">{selectedFile.name}</div>
										<div className="change-file-prompt">Click or drop to change</div>
									</>
								) : (
									<>
										<div className="upload-icon">📁</div>
										<div>Click to browse or drag an image here</div>
									</>
								)}
							</label>
						</div>

						{previewUrl && (
							<div className="image-preview-container">
								<h4>Original Image</h4>
								<img
									src={previewUrl}
									alt="Preview"
									className="image-preview"
								/>
								<div className="image-info">
									Original size: {imageSize.width} × {imageSize.height} px
								</div>
							</div>
						)}

						<div className="pixelate-controls">
							<div className="control-group">
								<label htmlFor="max-size">Board Size (1-100):</label>
								<div className="slider-container">
									<input
										type="range"
										id="max-size-slider"
										value={maxSize}
										onChange={handleMaxSizeChange}
										min="1"
										max="100"
										className="size-slider"
									/>
									<input
										type="number"
										id="max-size"
										value={maxSize}
										onChange={handleMaxSizeChange}
										min="1"
										max="100"
										className="size-input"
									/>
								</div>
								<span className="size-help">
									{finalImageSize.width && finalImageSize.height ?
										`Result will be ${finalImageSize.width}×${finalImageSize.height} pixels` :
										'Larger values create more detailed but larger boards'}
								</span>
							</div>

							<Button
								variant="primary"
								onClick={processImage}
								disabled={!selectedFile || isProcessing}
								className="process-button"
							>
								{isProcessing ? 'Processing...' : (pixelData.length > 0 ? 'Re-Process Image' : 'Process Image')}
							</Button>

							<div className="process-description">
								Adjust the size slider to see real-time preview updates
							</div>
						</div>
					</div>
				</Card>

				<Card className="result-card">
					<div className="card-header">
						<h3>2. Configure & Create Board</h3>
					</div>
					<div className="card-body">
						{error && (
							<Alert
								variant="error"
								message={error}
								dismissible
								onClose={() => setError(null)}
							/>
						)}

						{message && !error && (
							<Alert
								variant="success"
								message={message}
								dismissible
								onClose={() => setMessage(null)}
							/>
						)}

						<div className="hidden-canvas-container">
							<canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
						</div>

						{pixelData.length > 0 ? (
							<>
								<div className="pixelated-preview-container">
									<h4>Pixelated Preview</h4>
									<canvas
										ref={previewCanvasRef}
										className="pixelated-preview"
										style={{
											width: `${Math.min(300, finalImageSize.width * 5)}px`,
											imageRendering: 'pixelated'
										}}
									></canvas>
									<div className="image-info">
										Board size: {finalImageSize.width} × {finalImageSize.height} pixels
										<br/>
										Total pixels: {pixelData.length}
									</div>
								</div>

								<div className="create-board-form">
									<h4 className="form-section-title">Board Configuration</h4>

									<Input
										label="Board Title"
										value={boardTitle}
										onChange={(e) => setBoardTitle(e.target.value)}
										required
										placeholder="Enter a title for your pixel board"
									/>

									<TimeInput
										label="Board Duration"
										value={boardDurationSeconds}
										onChange={setBoardDurationSeconds}
										maxTime={365 * 24 * 60 * 60} // 365 days in seconds
										minTime={60 * 60} // 1 hour in seconds
										includeDays={true}
										id="board-duration"
									/>

									<TimeInput
										label="Pixel Placement Cooldown"
										value={pixelCooldownSeconds}
										onChange={setPixelCooldownSeconds}
										maxTime={24 * 60 * 60} // 24 hours in seconds
										minTime={0}
										id="pixel-cooldown"
									/>

									<div className="board-options">
										<Checkbox
											label="Allow redrawing over existing pixels"
											checked={allowRedraw}
											onChange={(e) => setAllowRedraw(e.target.checked)}
										/>

										<Checkbox
											label="Enable visitor mode (view-only after time expires)"
											checked={enableVisitor}
											onChange={(e) => setEnableVisitor(e.target.checked)}
										/>
									</div>

									<Button
										variant="primary"
										onClick={createPixelBoard}
										disabled={!boardTitle || isCreatingBoard || pixelData.length === 0}
										className="create-board-button"
									>
										{isCreatingBoard ? 'Creating Board...' : 'Create Pixel Board'}
									</Button>
								</div>
							</>
						) : (
							<div className="no-data-message">
								{selectedFile ?
									'Processing image...' :
									'Upload an image to see the preview here'}
							</div>
						)}
					</div>
				</Card>
			</div>
		</Layout>
	);
};

export default ImageToPixelBoard;
