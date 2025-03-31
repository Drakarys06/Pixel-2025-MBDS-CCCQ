import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import CreateBoardForm, { BoardFormData } from '../features/CreateBoardForm';
import Alert from '../ui/Alert';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Input, Checkbox, TimeInput } from '../ui/FormComponents';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/CreateBoardPage.css';
import '../../styles/features/ImageToPixelBoard.css';

interface PixelData {
	x: number;
	y: number;
	color: string;
}

const CreateBoardPage: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const navigate = useNavigate();
	const { currentUser } = useAuth();
	const [creationMode, setCreationMode] = useState<'manual' | 'image'>('manual');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [boardTitle, setBoardTitle] = useState<string>('');
	const [maxSize, setMaxSize] = useState<number>(32);
	const [pixelData, setPixelData] = useState<PixelData[]>([]);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [isCreatingBoard, setIsCreatingBoard] = useState<boolean>(false);
	const [message, setMessage] = useState<string | null>(null);
	const [imageSize, setImageSize] = useState<{width: number, height: number}>({width: 0, height: 0});
	const [finalImageSize, setFinalImageSize] = useState<{width: number, height: number}>({width: 0, height: 0});
	const [boardDurationSeconds, setBoardDurationSeconds] = useState<number>(30 * 24 * 60 * 60);
	const [allowRedraw, setAllowRedraw] = useState<boolean>(true);
	const [enableVisitor, setEnableVisitor] = useState<boolean>(true);
	const [pixelCooldownSeconds, setPixelCooldownSeconds] = useState<number>(0);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
	// Clear alerts when component unmounts
	useEffect(() => {
		return () => {
			if (success) {
				setSuccess(null);
			}
			if (error) {
				setError(null);
			}
		};
	}, [error, success]);

	// Reset sur changement de mode de création
	useEffect(() => {
		setError(null);
		setSuccess(null);
		setMessage(null);

		if (creationMode === 'manual') {
			// Réinitialiser les états d'importation d'image
			setSelectedFile(null);
			setPreviewUrl(null);
			setPixelData([]);
		}
	}, [creationMode]);

	// Effet pour le fichier d'image sélectionné
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

			// Effacer les données de traitement existantes quand un nouveau fichier est téléchargé
			setPixelData([]);
			setMessage(null);
		} else {
			setPreviewUrl(null);
			setPixelData([]);
		}
	}, [selectedFile]);


	// Handle form submission
	const handleSubmit = async (formData: BoardFormData) => {
		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Récupérer le token d'authentification
			const token = localStorage.getItem('token');

			if (!token) {
				throw new Error('You must be logged in to create a board');
			}

			const response = await fetch(`${API_URL}/api/pixelboards`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create board');
			}

			const createdBoard = await response.json();
			setSuccess('Board created successfully!');

			// Redirect to the new board after a short delay
			setTimeout(() => {
				navigate(`/board/${createdBoard._id}`);
			}, 1500);
		} catch (err) {
			console.error('Error creating board:', err);
			setError(err instanceof Error ? err.message : 'An unknown error occurred');
		} finally {
			setLoading(false);
		}
	};

	// Fonctions pour l'importation d'image
	const loadImageAndGetSize = (url: string) => {
		const img = new Image();
		img.onload = () => {
			setImageSize({
				width: img.width,
				height: img.height
			});

			// Auto-générer un titre basé sur le nom du fichier si vide
			if (!boardTitle && selectedFile) {
				const baseName = selectedFile.name.split('.')[0];
				setBoardTitle(`${baseName} Pixel Board`);
			}

			// Stocker l'image pour un traitement ultérieur
			imageRef.current = img;

			// Traiter automatiquement l'image deux fois après chargement
			setTimeout(() => {
				processImage();
				setTimeout(() => {
					processImage();
				}, 100);
			}, 100);
		};
		img.src = url;
	};

	// Gérer la sélection de fichier
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];

			// Valider le type de fichier
			if (!file.type.startsWith('image/')) {
				setError('Please select an image file');
				return;
			}

			setSelectedFile(file);
			setError(null);
		}
	};

	// Gérer le glisser-déposer
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];

			// Valider le type de fichier
			if (!file.type.startsWith('image/')) {
				setError('Please select an image file');
				return;
			}

			setSelectedFile(file);
			setError(null);
		}
	};

	// Gérer le changement de taille maximale
	const handleMaxSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const size = parseInt(e.target.value);
		if (!isNaN(size) && size > 0 && size <= 100) {
			setMaxSize(size);
			// Traiter automatiquement l'image quand la taille change
			if (imageRef.current) {
				processImage();
			}
		}
	};

	// Traiter l'image pour extraire les données de pixels
	const processImage = () => {
		if (!imageRef.current || !previewUrl) {
			setError('Please select an image first');
			return;
		}

		// Empêcher le retraitement si déjà en cours
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

			// Calculer les dimensions mises à l'échelle en conservant les proportions
			let scaledWidth, scaledHeight;
			if (img.width > img.height) {
				scaledWidth = maxSize;
				scaledHeight = Math.round((img.height / img.width) * maxSize);
			} else {
				scaledHeight = maxSize;
				scaledWidth = Math.round((img.width / img.height) * maxSize);
			}

			// Mettre à jour la taille finale de l'image
			setFinalImageSize({width: scaledWidth, height: scaledHeight});

			// Définir la taille du canvas
			const canvas = canvasRef.current;
			canvas.width = scaledWidth;
			canvas.height = scaledHeight;

			// Dessiner l'image mise à l'échelle
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				setIsProcessing(false);
				setError('Canvas context not available');
				return;
			}

			ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

			// Extraire les données de pixels
			const pixels: PixelData[] = [];

			for (let y = 0; y < scaledHeight; y++) {
				for (let x = 0; x < scaledWidth; x++) {
					const imageData = ctx.getImageData(x, y, 1, 1).data;
					const r = imageData[0];
					const g = imageData[1];
					const b = imageData[2];
					const a = imageData[3];

					// Ignorer les pixels transparents
					if (a === 0) continue;

					// Convertir en couleur hexadécimale
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

	// Afficher l'aperçu de l'image pixelisée
	const renderPreview = (pixels: PixelData[], width: number, height: number) => {
		if (!previewCanvasRef.current) return;

		const canvas = previewCanvasRef.current;
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Effacer le canvas
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, width, height);

		// Dessiner les pixels
		pixels.forEach(pixel => {
			ctx.fillStyle = pixel.color;
			ctx.fillRect(pixel.x, pixel.y, 1, 1);
		});
	};

	// Créer le pixel board à partir de l'image
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
			// 1. Créer le board
			const token = localStorage.getItem('token');

			// Préparer les données du board - créer le board initialement SANS cooldown
			const boardData = {
				title: boardTitle,
				width: finalImageSize.width,
				length: finalImageSize.height,
				time: Math.floor(boardDurationSeconds / 60), // Convertir les secondes en minutes pour l'API
				redraw: allowRedraw,
				visitor: enableVisitor,
				cooldown: 0 // Initialement à zéro pour permettre l'importation rapide d'image
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

			// 2. Placer tous les pixels
			// Pour éviter de surcharger le serveur, placer les pixels par lots
			const BATCH_SIZE = 100; // Taille de lot augmentée car pas de cooldown initial
			let placedCount = 0;
			let failedCount = 0;
			const totalPixels = pixelData.length;

			for (let i = 0; i < pixelData.length; i += BATCH_SIZE) {
				const batch = pixelData.slice(i, i + BATCH_SIZE);

				// Préparer tous les placements de pixels du lot courant
				const pixelPromises = batch.map(async (pixel) => {
					try {
						const response = await fetch(`${API_URL}/api/pixels/board/${boardId}/place`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': token ? `Bearer ${token}` : ''
								// Pas d'en-têtes spéciaux nécessaires car le cooldown est à 0
							},
							body: JSON.stringify({
								x: pixel.x,
								y: pixel.y,
								color: pixel.color
							})
						});

						if (response.ok) {
							return true; // Succès
						} else {
							console.warn(`Failed to place pixel at (${pixel.x}, ${pixel.y}): ${response.status}`);
							return false; // Échec
						}
					} catch (err) {
						console.error(`Error placing pixel at (${pixel.x}, ${pixel.y}):`, err);
						return false; // Échec
					}
				});

				// Attendre que tous les placements de pixels de ce lot soient terminés
				const results = await Promise.all(pixelPromises);

				// Compter les succès et les échecs
				const batchSuccesses = results.filter(result => result).length;
				const batchFailures = results.filter(result => !result).length;

				placedCount += batchSuccesses;
				failedCount += batchFailures;

				// Mettre à jour le message de progression
				const progressPercent = Math.round(((placedCount + failedCount) / totalPixels) * 100);
				setMessage(`Placed ${placedCount} of ${totalPixels} pixels (${progressPercent}%)...`);
			}

			// 3. Mettre à jour le board avec le cooldown souhaité si nécessaire
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

			// 4. Naviguer vers le nouveau board
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

	// Si l'utilisateur est en mode invité, afficher un message explicatif
	const isGuest = currentUser?.isGuest;

	return (
		<Layout title="Create Your Pixel Board">
			{error && (
				<Alert
					variant="error"
					message={error}
					dismissible
					onClose={() => setError(null)}
				/>
			)}

			{success && (
				<Alert
					variant="success"
					message={success}
					dismissible
					onClose={() => setSuccess(null)}
				/>
			)}

			{isGuest && (
				<Alert
					variant="info"
					message="You are in guest mode. Consider creating an account to keep track of your boards and access more features."
					dismissible
				/>
			)}

			{/* Creation Method Selection */}
			<div className="creation-methods">
				<h2 className="creation-title">Choose Your Creation Method</h2>

				<div className="creation-options">
					<div className={`creation-option ${creationMode === 'image' ? 'active' : ''}`}>
						<div
							className="option-card"
							onClick={() => setCreationMode('image')}
							style={{ cursor: 'pointer' }}
						>
							<div className="option-icon">🖼️</div>
							<h3>Import from Image</h3>
							<p>Upload an image to automatically convert it to a pixel board</p>
							{creationMode === 'image' ? (
								<div className="option-highlight">Currently selected</div>
							) : (
								<Button
									variant="secondary"
									className="option-button"
									onClick={() => setCreationMode('image')}
								>
									Choose Image
								</Button>
							)}
						</div>
					</div>

					<div className="creation-option-divider">
						<span>or</span>
					</div>

					<div className={`creation-option ${creationMode === 'manual' ? 'active' : ''}`}>
						<div
							className="option-card"
							onClick={() => setCreationMode('manual')}
							style={{ cursor: 'pointer' }}
						>
							<div className="option-icon">✏️</div>
							<h3>Create Manually</h3>
							<p>Set up a blank canvas with your preferred settings</p>
							{creationMode === 'manual' ? (
								<div className="option-highlight">Currently selected</div>
							) : (
								<Button
									variant="secondary"
									className="option-button"
									onClick={() => setCreationMode('manual')}
								>
									Choose Manual
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Création Manuelle */}
			{creationMode === 'manual' && (
				<div className="create-board-container">
					<div className="create-board-main">
						<Card>
							<div className="card-header">
								<h3 className="form-title">Board Configuration</h3>
							</div>
							<div className="card-body">
								<CreateBoardForm
									onSubmit={handleSubmit}
									loading={loading}
								/>
							</div>
						</Card>
					</div>

					<div className="create-board-info">
						<Card>
							<div className="card-header">
								<h3 className="info-title">
									<span className="info-icon">💡</span>
									Tips & Guidelines
								</h3>
							</div>
							<div className="card-body">
								<ul className="guidelines-list">
									<li><strong>Size matters:</strong> Choose dimensions that match your artistic vision. Smaller boards fill up quicker!</li>
									<li><strong>Time limit:</strong> Set 30 minutes for small boards, longer for larger creations.</li>
									<li><strong>Cooldown:</strong> Add a cooldown to prevent rapid consecutive placements and give everyone a chance.</li>
									<li><strong>Redraw option:</strong> Allow users to place pixels over existing ones for evolving creations.</li>
									<li><strong>Visitor mode:</strong> Enable viewing after the board&apos;s active time expires to showcase your community&apos;s work.</li>
								</ul>
							</div>
						</Card>
					</div>
				</div>
			)}

			{/* Création à partir d'une image */}
			{creationMode === 'image' && (
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
			)}
		</Layout>
	);
};

export default CreateBoardPage;
