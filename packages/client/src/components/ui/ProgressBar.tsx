import React from 'react';
import '../../styles/ui/ProgressBar.css';

interface ProgressBarProps {
	value: number; // Value between 0 and 100
	className?: string;
	height?: number;
	color?: string;
	backgroundColor?: string;
	animated?: boolean;
	label?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
	value,
	className = '',
	height = 8,
	color,
	backgroundColor,
	animated = false,
	label = false,
}) => {
	// Ensure value is between 0 and 100
	const normalizedValue = Math.min(Math.max(value, 0), 100);

	// Determine color based on value
	const getColorClass = () => {
		if (color) return '';

		if (normalizedValue < 25) return 'progress-danger';
		if (normalizedValue < 50) return 'progress-warning';
		return 'progress-success';
	};

	const progressClasses = [
		'progress',
		animated ? 'progress-animated' : '',
		className
	].filter(Boolean).join(' ');

	const fillClasses = [
		'progress-fill',
		getColorClass()
	].filter(Boolean).join(' ');

	return (
		<div className="progress-container">
			<div
				className={progressClasses}
				style={{
					height: `${height}px`,
					backgroundColor: backgroundColor
				}}
			>
				<div
					className={fillClasses}
					style={{
						width: `${normalizedValue}%`,
						backgroundColor: color
					}}
				/>
			</div>
			{label && (
				<span className="progress-label">{normalizedValue}%</span>
			)}
		</div>
	);
};

export default ProgressBar;