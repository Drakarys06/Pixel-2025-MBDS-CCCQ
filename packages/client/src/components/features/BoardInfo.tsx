import React from 'react';
import { Link } from 'react-router-dom';
import TimeRemaining from '../ui/TimeRemaining';
import '../../styles/features/BoardInfo.css';

interface BoardInfoProps {
	title: string;
	creator: string;
	width: number;
	height: number;
	creationTime: string;
	duration: number;
	closeTime: string | null;
	redraw: boolean;
	pixelCount: number;
	visitor: boolean;
}

const BoardInfo: React.FC<BoardInfoProps> = ({
	title,
	creator,
	width,
	height,
	creationTime,
	duration,
	closeTime,
	redraw,
	pixelCount,
	visitor
}) => {
	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// Calculate if board is expired
	const isExpired = React.useMemo(() => {
		if (closeTime) return true;

		const creation = new Date(creationTime);
		const end = new Date(creation.getTime() + duration * 60 * 1000);
		return new Date() > end;
	}, [creationTime, duration, closeTime]);

	return (
		<div className="board-info">
			<div className="board-header">
				<div className="board-header-content">
					<Link to="/explore" className="board-back-button">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="19" y1="12" x2="5" y2="12"></line>
							<polyline points="12 19 5 12 12 5"></polyline>
						</svg>
						Back
					</Link>
					<h1 className="board-title">{title}</h1>
					<TimeRemaining
						creationTime={creationTime}
						durationMinutes={duration}
						closeTime={closeTime}
						className="board-time-remaining"
					/>
				</div>
			</div>

			<div className="board-meta">
				<div className="board-meta-item">
					<span className="meta-label">Created by</span>
					<span className="meta-value">{creator}</span>
				</div>

				<div className="board-meta-item">
					<span className="meta-label">Dimensions</span>
					<span className="meta-value">{width} × {height}</span>
				</div>

				<div className="board-meta-item">
					<span className="meta-label">Created on</span>
					<span className="meta-value">{formatDate(creationTime)}</span>
				</div>
				<div className="board-meta-item">
					<span className="meta-label">Redraw allowed</span>
					<span className="meta-value">
						{redraw ? (
							<span className="status-badge status-enabled">Yes</span>
						) : (
							<span className="status-badge status-disabled">No</span>
						)}
					</span>
				</div>

				<div className="board-meta-item">
					<span className="meta-label">Visitor mode</span>
					<span className="meta-value">
						{visitor ? (
							<span className="status-badge status-visitor">Enabled</span>
						) : (
							<span className="status-badge status-visitor-disabled">Disabled</span>
						)}
					</span>
				</div>

				<div className="board-meta-item">
					<span className="meta-label">Pixels remaining</span>
					<span className="meta-value">{(width * height - pixelCount).toLocaleString()} / {width * height} </span>
				</div>
			</div>
		</div>
	);
};

export default BoardInfo;
