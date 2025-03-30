import React from 'react';
import '../../styles/ui/EnhancedColorPicker.css';

interface EnhancedColorPickerProps {
	selectedColor: string;
	onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
}

const EnhancedColorPicker: React.FC<EnhancedColorPickerProps> = ({
																	 selectedColor,
																	 onColorChange,
																	 disabled = false
																 }) => {
	// Couleurs prédéfinies populaires
	const presetColors = [
		'#000000', // Noir
		'#FFFFFF', // Blanc
		'#FF0000', // Rouge
		'#00FF00', // Vert
		'#0000FF', // Bleu
		'#FFFF00', // Jaune
		'#FF00FF', // Magenta
		'#00FFFF', // Cyan
	];

	// Fonction pour sélectionner une couleur prédéfinie
	const handlePresetColorClick = (color: string) => {
		if (disabled) return;

		// Créer un événement synthétique
		const syntheticEvent = {
			target: { value: color }
		} as React.ChangeEvent<HTMLInputElement>;

		onColorChange(syntheticEvent);
	};

	return (
		<div className="enhanced-color-picker">
			<div className="color-picker-container">
				<div className="color-picker-controls">
					<input
						type="color"
						className="form-color-picker"
						value={selectedColor}
						onChange={onColorChange}
						disabled={disabled}
					/>

					<input
						type="text"
						value={selectedColor}
						onChange={onColorChange}
						className="color-hex-input"
						pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
						title="Hex color code (e.g. #FF0000)"
						disabled={disabled}
					/>
				</div>

				<div className="preset-colors">
					{presetColors.map((color) => (
						<div
							key={color}
							className={`preset-color ${color === selectedColor ? 'selected' : ''}`}
							style={{ backgroundColor: color }}
							onClick={() => handlePresetColorClick(color)}
							title={color}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default EnhancedColorPicker;
