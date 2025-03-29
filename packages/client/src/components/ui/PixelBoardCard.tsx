import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import TimeRemaining from '../ui/TimeRemaining';
import Button from '../ui/Button';
import '../../styles/ui/PixelBoardCard.css';

interface PixelBoardCardProps {
	id: string;
	title: string;
	width: number;
	length: number;
	creationTime: string;
	time: number;
	closeTime: string | null;
	creator: string;
	creatorUsername?: string;
	className?: string;
	showSettings?: boolean;
	onSettingsClick?: (id: string) => void;
}

const PixelBoardCard: React.FC<PixelBoardCardProps> = ({
														   id,
														   title,
														   width,
														   length,
														   creationTime,
														   time,
														   closeTime,
														   creator,
														   creatorUsername,
														   className = '',
														   showSettings = false,
														   onSettingsClick
													   }) => {
	// Function to generate random pixel blocks for preview
	const generateRandomBlocks = () => {
		const colors = ['#9370DB', '#90EE90', '#F0E68C', '#6495ED', '#98FB98', '#FF7F50', '#87CEEB'];
		const blocks = [];

		// Create 5 random blocks
		const positions = [
			{ top: '30px', left: '40px' },
			{ top: '70px', left: '80px' },
			{ top: '110px', left: '40px' },
			{ top: '50px', left: '120px' },
			{ top: '90px', left: '160px' }
		];

		for (let i = 0; i < 5; i++) {
			const color = colors[Math.floor(Math.random() * colors.length)];
			blocks.push(
				<div
					key={i}
					className="pixel-block-preview"
					style={{
						backgroundColor: color,
						top: positions[i].top,
						left: positions[i].left
					}}
				/>
			);
		}

		return blocks;
	};

	// Format the creation date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	// Generate blocks for preview
	const pixelBlocks = generateRandomBlocks();

	// Determine if the board is expired
	const [isExpired, setIsExpired] = React.useState(
		closeTime !== null || new Date(creationTime).getTime() + time * 60 * 1000 < Date.now()
	);

	const handleTimeExpired = () => {
		setIsExpired(true);
	};

	const cardClasses = ['pixel-board-card', className].filter(Boolean).join(' ');

	// Utiliser creatorUsername s'il existe, sinon utiliser creator
	const displayCreator = creatorUsername || creator;

	// Handle settings button click
	const handleSettingsClick = (e: React.MouseEvent) => {
		e.preventDefault(); // Prevent navigating to board
		if (onSettingsClick) {
			onSettingsClick(id);
		}
	};

	return (
		<Card className={cardClasses}>
			<div className="pixel-board-preview">
				{pixelBlocks}
				<TimeRemaining
					creationTime={creationTime}
					durationMinutes={time}
					closeTime={closeTime}
					showProgressBar={false}
					badge={true}
					onTimeExpired={handleTimeExpired}
				/>
			</div>

			<div className="card-body">
				<h3 className="pixel-board-title">{title}</h3>
				<div className="pixel-board-meta">
					<span>{width} x {length}</span>
					<span>Created: {formatDate(creationTime)}</span>
				</div>

				<TimeRemaining
					creationTime={creationTime}
					durationMinutes={time}
					closeTime={closeTime}
					className="pixel-board-time-progress"
					onTimeExpired={handleTimeExpired}
				/>
			</div>

			<div className="card-footer">
				<div className="pixel-board-creator">By: {displayCreator}</div>
				<div className="card-actions">
					{showSettings && (
						<button
							className="board-settings-button"
							onClick={handleSettingsClick}
						>
							Settings
						</button>
					)}
					<Link to={`/board/${id}`}>
						<Button
							variant={isExpired ? 'secondary' : 'join'}
							size="sm"
						>
							{isExpired ? 'View Board' : 'Join Board'}
						</Button>
					</Link>
				</div>
			</div>
		</Card>
	);
};

export default PixelBoardCard;
