import React, { useState, useEffect, useCallback } from 'react';
import ProgressBar from '../ui/ProgressBar';
import './TimeRemaining.css';

interface TimeRemainingProps {
	creationTime: string;
	durationMinutes: number;
	closeTime: string | null;
	showProgressBar?: boolean;
	className?: string;
	badge?: boolean;
	onTimeExpired?: () => void;
}

interface TimeData {
	timeRemaining: string;
	isExpired: boolean;
	percentRemaining: number;
}

const TimeRemaining: React.FC<TimeRemainingProps> = ({
	creationTime,
	durationMinutes,
	closeTime,
	showProgressBar = true,
	className = '',
	badge = false,
	onTimeExpired
}) => {
	const [timeData, setTimeData] = useState<TimeData>({
		timeRemaining: "Calculating...",
		isExpired: false,
		percentRemaining: 100
	});

	const calculateTime = useCallback(() => {
		const now = new Date();
		const creation = new Date(creationTime);
		const durationMs = durationMinutes * 60 * 1000;
		const endTime = closeTime ? new Date(closeTime) : new Date(creation.getTime() + durationMs);

		// Check if board time has expired
		if (closeTime || now >= endTime) {
			setTimeData({
				timeRemaining: "Expired",
				isExpired: true,
				percentRemaining: 0
			});

			if (onTimeExpired) {
				onTimeExpired();
			}

			return;
		}

		// Calculate remaining time
		const totalMs = durationMs;
		const elapsedMs = now.getTime() - creation.getTime();
		const remainingMs = Math.max(totalMs - elapsedMs, 0);
		const percentRemaining = Math.round((remainingMs / totalMs) * 100);

		// Format the time remaining in days, hours, minutes
		const remainingSeconds = Math.floor(remainingMs / 1000);
		const remainingDays = Math.floor(remainingSeconds / 86400); // 86400 seconds in a day
		const remainingHours = Math.floor((remainingSeconds % 86400) / 3600);
		const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);

		let timeString;
		if (remainingDays > 0) {
			// If days, show days and hours (don't need minutes)
			timeString = `${remainingDays}d ${remainingHours}h`;
		} else if (remainingHours > 0) {
			// If hours but no days, show hours and minutes
			timeString = `${remainingHours}h ${remainingMinutes}m`;
		} else {
			// Only minutes remaining
			timeString = `${remainingMinutes}m`;
		}

		setTimeData({
			timeRemaining: timeString,
			isExpired: false,
			percentRemaining
		});
	}, [creationTime, durationMinutes, closeTime, onTimeExpired]);

	useEffect(() => {
		calculateTime();

		const timer = setInterval(() => {
			calculateTime();
		}, 10000);

		return () => clearInterval(timer);
	}, [calculateTime]);

	const { timeRemaining, isExpired, percentRemaining } = timeData;

	// Apply different styles based on time remaining
	const getStatusClass = () => {
		if (isExpired) return 'time-expired';
		if (percentRemaining < 25) return 'time-ending-soon';
		return '';
	};

	if (badge) {
		const badgeClasses = [
			'time-badge',
			getStatusClass(),
			className
		].filter(Boolean).join(' ');

		return <div className={badgeClasses}>{timeRemaining}</div>;
	}

	const containerClasses = [
		'time-remaining',
		getStatusClass(),
		className
	].filter(Boolean).join(' ');

	return (
		<div className={containerClasses}>
			<div className="time-text">{timeRemaining}</div>
			{showProgressBar && !isExpired && (
				<ProgressBar
					value={percentRemaining}
					height={6}
				/>
			)}
		</div>
	);
};

export default TimeRemaining;
