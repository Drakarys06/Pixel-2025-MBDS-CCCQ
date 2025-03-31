import React from 'react';
import '../../styles/layout/Container.css';

interface ContainerProps {
	children: React.ReactNode;
	className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
	const containerClasses = ['container', className].filter(Boolean).join(' ');

	return (
		<div className={containerClasses}>
			{children}
		</div>
	);
};

export default Container;