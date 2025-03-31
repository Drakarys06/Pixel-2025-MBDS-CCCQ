import React, { useState, useEffect, useCallback } from 'react';
import ProgressBar from '../ui/ProgressBar';
import '../../styles/ui/CooldownTimer.css';

interface CooldownTimerProps {
	remainingSeconds: number;
	totalSeconds: number;
	showProgressBar?: boolean;
	className?: string;
	onCooldownComplete?: () => void;
}

const CooldownTimer: React.FC<CooldownTimerProps> = ({
	remainingSeconds,
	totalSeconds,
	showProgressBar = true,
	className = '',
	onCooldownComplete
}) => {
	const [countdown, setCountdown] = useState<number>(remainingSeconds);
	const [isComplete, setIsComplete] = useState<boolean>(remainingSeconds <= 0);

	// Function to format seconds into a readable time string
	const formatTimeString = useCallback((seconds: number): string => {
		if (seconds <= 0) return "Ready";

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		} else {
			return `${secs}s`;
		}
	}, []);

	// Reset countdown when props change
	useEffect(() => {
		setCountdown(remainingSeconds);
		setIsComplete(remainingSeconds <= 0);
	}, [remainingSeconds]);

	// Update countdown every second
	useEffect(() => {
		if (countdown <= 0) {
			setIsComplete(true);
			if (onCooldownComplete) {
				onCooldownComplete();
			}
			return;
		}

		const timer = setInterval(() => {
			setCountdown(prev => {
				const newValue = prev - 1;
				if (newValue <= 0) {
					clearInterval(timer);
					setIsComplete(true);
					if (onCooldownComplete) {
						onCooldownComplete();
					}
					return 0;
				}
				return newValue;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [countdown, onCooldownComplete]);

	// Progress bar
	const percentComplete = Math.min(100, Math.max(0,
		totalSeconds > 0 ? ((totalSeconds - countdown) / totalSeconds) * 100 : 100
	));

	const getStatusClass = () => {
		if (isComplete) return 'cooldown-complete';
		if (countdown < totalSeconds * 0.25) return 'cooldown-ending-soon';
		return '';
	};

	const containerClasses = [
		'cooldown-timer',
		getStatusClass(),
		className
	].filter(Boolean).join(' ');

	return (
		<div className={containerClasses}>
			<div className="cooldown-text">
				{isComplete ? (
					<span className="cooldown-ready">Ready to place a pixel!</span>
				) : (
					<>
						<span className="cooldown-label">Wait</span>
						<span className="time-value">{formatTimeString(countdown)}</span>
					</>
				)}
			</div>

			{showProgressBar && !isComplete && (
				<ProgressBar
					value={percentComplete}
					height={6}
					animated={true}
				/>
			)}
		</div>
	);
};

export default CooldownTimer;