import React from 'react';
import '../../styles/ui/Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'link' | 'login' | 'signup' | 'join';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
	children: React.ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	onClick?: () => void;
	className?: string;
	fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
	children,
	variant = 'primary',
	size = 'md',
	disabled = false,
	type = 'button',
	onClick,
	className = '',
	fullWidth = false,
}) => {
	// Build classes based on props
	const buttonClasses = [
		'btn',
		`btn-${variant}`,
		`btn-${size}`,
		fullWidth ? 'btn-full-width' : '',
		className
	].filter(Boolean).join(' ');

	return (
		<button
			type={type}
			className={buttonClasses}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
};

export default Button;