import React, { useState, useEffect } from 'react';
import '../../styles/ui/Alert.css';

type AlertVariant = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
	variant: AlertVariant;
	message: string;
	duration?: number; // Duration in milliseconds, if auto-dismiss
	onClose?: () => void;
	className?: string;
	dismissible?: boolean;
}

const Alert: React.FC<AlertProps> = ({
	variant,
	message,
	duration,
	onClose,
	className = '',
	dismissible = true,
}) => {
	const [visible, setVisible] = useState(true);

	// Auto-dismiss logic
	useEffect(() => {
		if (duration && duration > 0) {
			const timer = setTimeout(() => {
				setVisible(false);
				if (onClose) onClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [duration, onClose]);

	// Handle manual dismiss
	const handleDismiss = () => {
		setVisible(false);
		if (onClose) onClose();
	};

	if (!visible) return null;

	const alertClasses = [
		'alert',
		`alert-${variant}`,
		className
	].filter(Boolean).join(' ');

	return (
		<div className={alertClasses} role="alert">
			<div className="alert-content">{message}</div>
			{dismissible && (
				<button
					className="alert-close"
					onClick={handleDismiss}
					aria-label="Close"
				>
					&times;
				</button>
			)}
		</div>
	);
};

export default Alert;