import React, { useState, useEffect } from 'react';
import PixelForm, { PixelData } from './PixelForm';
import PixelList from './PixelList';

interface Pixel {
	_id: string;
	x: number;
	y: number;
	color: string;
	lastModifiedDate: string;
	modifiedBy: string[];
	boardId: string;
}

const PixelContainer: React.FC = () => {
	const [pixels, setPixels] = useState<Pixel[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [formLoading, setFormLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [selectedBoardId, setSelectedBoardId] = useState<string>('');
	const [pixelBoards, setPixelBoards] = useState<{ _id: string; title: string }[]>([]);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Fetch pixel boards for dropdown
	const fetchPixelBoards = async () => {
		try {
			const response = await fetch(`${API_URL}/api/pixelboards`);
			if (!response.ok) {
				throw new Error('Failed to fetch pixel boards');
			}
			const data = await response.json();
			setPixelBoards(data);

			// Select the first board by default if available
			if (data.length > 0 && !selectedBoardId) {
				setSelectedBoardId(data[0]._id);
				fetchPixels(data[0]._id);
			}
		} catch (err) {
			console.error('Error fetching pixel boards:', err);
		}
	};

	// Fetch pixels for a specific board
	const fetchPixels = async (boardId: string) => {
		if (!boardId) return;

		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_URL}/api/pixels?boardId=${boardId}`);
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch pixels: ${response.status} ${response.statusText} - ${errorText}`);
			}
			const data = await response.json();
			setPixels(data);
		} catch (err) {
			console.error('Full error details:', err);
			setError('Error fetching pixels. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	// Create a new pixel
	const createPixel = async (pixelData: PixelData) => {
		setFormLoading(true);
		setError(null);
		setSuccessMessage(null);
		try {
			const response = await fetch(`${API_URL}/api/pixels/board/${selectedBoardId}/place`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...pixelData,
					boardId: selectedBoardId
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to place pixel');
			}

			// Refresh the pixels list
			fetchPixels(selectedBoardId);
			setSuccessMessage('Pixel placed successfully!');

			// Clear success message after 3 seconds
			setTimeout(() => {
				setSuccessMessage(null);
			}, 3000);
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError('An unknown error occurred');
			}
			console.error('Error placing pixel:', err);
		} finally {
			setFormLoading(false);
		}
	};

	// Delete a pixel
	const deletePixel = async (id: string) => {
		if (!window.confirm('Are you sure you want to delete this pixel?')) {
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_URL}/api/pixels/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete pixel');
			}

			// Update local state
			setPixels(prevPixels => prevPixels.filter(pixel => pixel._id !== id));
			setSuccessMessage('Pixel deleted successfully!');

			// Clear success message after 3 seconds
			setTimeout(() => {
				setSuccessMessage(null);
			}, 3000);
		} catch (err) {
			setError('Error deleting pixel. Please try again.');
			console.error('Error deleting pixel:', err);
		} finally {
			setLoading(false);
		}
	};

	// Handle board selection change
	const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const boardId = e.target.value;
		setSelectedBoardId(boardId);
		fetchPixels(boardId);
	};

	// Fetch pixel boards when the component mounts
	useEffect(() => {
		fetchPixelBoards();
	}, []);

	return (
		<div className="pixel-container">
			<h1>Pixel Management</h1>

			{error && <div className="error-message">{error}</div>}
			{successMessage && <div className="success-message">{successMessage}</div>}

			<div className="board-selector">
				<label htmlFor="board-select">Select Board: </label>
				<select
					id="board-select"
					value={selectedBoardId}
					onChange={handleBoardChange}
					disabled={pixelBoards.length === 0}
				>
					{pixelBoards.length === 0 && (
						<option value="">No boards available</option>
					)}
					{pixelBoards.map(board => (
						<option key={board._id} value={board._id}>
							{board.title}
						</option>
					))}
				</select>
			</div>

			<div className="container-layout">
				<div className="form-section">
					<PixelForm
						onSubmit={createPixel}
						loading={formLoading}
						disabled={!selectedBoardId}
					/>
				</div>

				<div className="list-section">
					<PixelList
						pixels={pixels}
						loading={loading}
						onDelete={deletePixel}
						boardId={selectedBoardId}
					/>
				</div>
			</div>
		</div>
	);
};

export default PixelContainer;
