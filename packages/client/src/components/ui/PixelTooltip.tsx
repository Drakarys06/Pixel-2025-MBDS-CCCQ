import React, { useEffect, useRef } from 'react';
import '../../styles/ui/PixelTooltip.css';

interface PixelTooltipProps {
	visible: boolean;
	content: string;
	x: number;
	y: number;
	onSizeChange?: (width: number, height: number) => void;
}

const PixelTooltip: React.FC<PixelTooltipProps> = ({
	visible,
	content,
	x,
	y,
	onSizeChange
}) => {
	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (visible && tooltipRef.current && onSizeChange) {
			const { offsetWidth, offsetHeight } = tooltipRef.current;
			onSizeChange(offsetWidth, offsetHeight);
		}
	}, [visible, content, onSizeChange]);

	if (!visible) return null;

	const calculatePosition = () => {
		const offset = 10;
		const tooltipWidth = tooltipRef.current?.offsetWidth || 200;
		const tooltipHeight = tooltipRef.current?.offsetHeight || 100;

		let posX = x - offset;
		let posY = y + offset;

		if (posX + tooltipWidth > window.innerWidth) {
			posX = x - tooltipWidth - offset;
		}

		if (posY + tooltipHeight > window.innerHeight) {
			posY = y - tooltipHeight - offset;
		}

		return { left: posX + 'px', top: posY + 'px' };
	};

	return (
		<div
			ref={tooltipRef}
			className="pixel-tooltip"
			style={calculatePosition()}
		>
			{content.split('\n').map((line, index) => (
				<React.Fragment key={index}>
					{line}
					{index < content.split('\n').length - 1 && <br />}
				</React.Fragment>
			))}
		</div>
	);
};

export default PixelTooltip;
