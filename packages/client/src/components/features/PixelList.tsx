import React, { useState } from 'react';

interface Pixel {
	_id: string;
	x: number;
	y: number;
	color: string;
	lastModifiedDate: string;
	modifiedBy: string[];
	boardId: string;
}

interface PixelListProps {
	pixels: Pixel[];
	loading: boolean;
	onDelete: (id: string) => void;
	boardId: string;
}

const PixelList: React.FC<PixelListProps> = ({ pixels, loading, onDelete, boardId }) => {
	const [visualizationMode, setVisualizationMode] = useState<'list' | 'grid'>('list');

	if (!boardId) {
		return <div className="no-data">Please select a board to view pixels.</div>;
	}

	if (loading) {
		return <div className="loading">Loading pixels...</div>;
	}

	if (pixels.length === 0) {
		return <div className="no-data">No pixels found on this board. Place one to get started.</div>;
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const toggleVisualizationMode = () => {
		setVisualizationMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
	};

	// Find board dimensions (max x and y)
	const maxX = Math.max(...pixels.map(pixel => pixel.x));
	const maxY = Math.max(...pixels.map(pixel => pixel.y));

	// Create a 2D grid of pixels
	const pixelGrid: (Pixel | null)[][] = [];
	for (let y = 0; y <= maxY; y++) {
		pixelGrid[y] = [];
		for (let x = 0; x <= maxX; x++) {
			const pixelAtPos = pixels.find(p => p.x === x && p.y === y);
			pixelGrid[y][x] = pixelAtPos || null;
		}
	}

	return (
		<div className="pixel-list">
			<div className="list-header">
				<h2>Pixels on Board</h2>
				<button onClick={toggleVisualizationMode} className="toggle-view-btn">
					Switch to {visualizationMode === 'list' ? 'Grid' : 'List'} View
				</button>
			</div>

			{visualizationMode === 'list' ? (
				<table>
					<thead>
					<tr>
						<th>Position</th>
						<th>Color</th>
						<th>Last Modified</th>
						<th>Modified By</th>
						<th>Actions</th>
					</tr>
					</thead>
					<tbody>
					{pixels.map((pixel) => (
						<tr key={pixel._id}>
							<td>({pixel.x}, {pixel.y})</td>
							<td>
								<div className="color-sample" style={{ backgroundColor: pixel.color }}></div>
								{pixel.color}
							</td>
							<td>{formatDate(pixel.lastModifiedDate)}</td>
							<td>
								{pixel.modifiedBy.length > 3
									? `${pixel.modifiedBy.slice(0, 3).join(', ')} + ${pixel.modifiedBy.length - 3} more`
									: pixel.modifiedBy.join(', ')}
							</td>
							<td>
								<button onClick={() => onDelete(pixel._id)}>Delete</button>
							</td>
						</tr>
					))}
					</tbody>
				</table>
			) : (
				<div className="pixel-grid-container">
					<div className="pixel-grid" style={{
						gridTemplateColumns: `repeat(${maxX + 1}, 20px)`,
						gridTemplateRows: `repeat(${maxY + 1}, 20px)`
					}}>
						{pixelGrid.flat().map((pixel, index) => (
							<div
								key={index}
								className="grid-cell"
								style={{
									backgroundColor: pixel ? pixel.color : '#f0f0f0',
									border: '1px solid #ddd'
								}}
								title={pixel ? `(${pixel.x}, ${pixel.y}) - ${pixel.color}` : 'Empty'}
								onClick={() => pixel && onDelete(pixel._id)}
							/>
						))}
					</div>
					<div className="grid-instructions">
						<p>Click on a pixel to delete it</p>
						<p>Grid size: {maxX + 1} x {maxY + 1}</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default PixelList;
