import React, { useState } from 'react';

interface PixelFormProps {
	onSubmit: (pixelData: PixelData) => void;
	loading: boolean;
	disabled: boolean;
}

export interface PixelData {
	x: number;
	y: number;
	color: string;
	userId: string;
}

const PixelForm: React.FC<PixelFormProps> = ({ onSubmit, loading, disabled }) => {
	const [formData, setFormData] = useState<PixelData>({
		x: 0,
		y: 0,
		color: '#000000',
		userId: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;

		setFormData(prevState => ({
			...prevState,
			[name]: type === 'number' ? parseInt(value, 10) : value
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	return (
		<div className="pixel-form">
			<h2>Place a Pixel</h2>
			<form onSubmit={handleSubmit}>
				<div className="form-group">
					<label htmlFor="x">X Coordinate:</label>
					<input
						type="number"
						id="x"
						name="x"
						value={formData.x}
						onChange={handleChange}
						required
						min={0}
						disabled={disabled}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="y">Y Coordinate:</label>
					<input
						type="number"
						id="y"
						name="y"
						value={formData.y}
						onChange={handleChange}
						required
						min={0}
						disabled={disabled}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="color">Color:</label>
					<div className="color-picker-container">
						<input
							type="color"
							id="color"
							name="color"
							value={formData.color}
							onChange={handleChange}
							disabled={disabled}
						/>
						<input
							type="text"
							name="color"
							value={formData.color}
							onChange={handleChange}
							pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
							title="Hex color code (e.g. #FF0000)"
							required
							disabled={disabled}
						/>
					</div>
				</div>

				<div className="form-group">
					<label htmlFor="userId">User ID:</label>
					<input
						type="text"
						id="userId"
						name="userId"
						value={formData.userId}
						onChange={handleChange}
						required
						disabled={disabled}
						placeholder="Enter your user ID"
					/>
				</div>

				<button type="submit" disabled={loading || disabled}>
					{loading ? 'Placing...' : 'Place Pixel'}
				</button>

				{disabled && (
					<div className="form-notice">
						Please select a board to place pixels
					</div>
				)}
			</form>
		</div>
	);
};

export default PixelForm;
