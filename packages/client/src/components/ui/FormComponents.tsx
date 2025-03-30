import React from 'react';
import '../../styles/ui/FormComponents.css';

// Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
												label,
												error,
												fullWidth = true,
												className = '',
												id,
												...rest
											}) => {
	const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
	const inputClasses = [
		'form-input',
		error ? 'input-error' : '',
		fullWidth ? 'input-full-width' : '',
		className
	].filter(Boolean).join(' ');

	return (
		<div className={`form-group ${fullWidth ? 'form-group-full-width' : ''}`}>
			{label && <label className="form-label" htmlFor={inputId}>{label}</label>}
			<input id={inputId} className={inputClasses} {...rest} />
			{error && <div className="form-error">{error}</div>}
		</div>
	);
};

// Select component
interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
	label?: string;
	error?: string;
	options: SelectOption[];
	fullWidth?: boolean;
	onChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
												  label,
												  error,
												  options,
												  fullWidth = true,
												  className = '',
												  id,
												  onChange,
												  ...rest
											  }) => {
	const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
	const selectClasses = [
		'form-select',
		error ? 'select-error' : '',
		fullWidth ? 'select-full-width' : '',
		className
	].filter(Boolean).join(' ');

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (onChange) {
			onChange(e.target.value);
		}
	};

	return (
		<div className={`form-group ${fullWidth ? 'form-group-full-width' : ''}`}>
			{label && <label className="form-label" htmlFor={selectId}>{label}</label>}
			<select
				id={selectId}
				className={selectClasses}
				onChange={handleChange}
				{...rest}
			>
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{error && <div className="form-error">{error}</div>}
		</div>
	);
};

// Checkbox component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label: string;
	error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
													  label,
													  error,
													  className = '',
													  id,
													  ...rest
												  }) => {
	const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
	const checkboxClasses = [
		'form-checkbox',
		error ? 'checkbox-error' : '',
		className
	].filter(Boolean).join(' ');

	return (
		<div className="form-group form-group-checkbox">
			<label className="checkbox-label" htmlFor={checkboxId}>
				<input
					type="checkbox"
					id={checkboxId}
					className={checkboxClasses}
					{...rest}
				/>
				<span className="checkbox-text">{label}</span>
			</label>
			{error && <div className="form-error">{error}</div>}
		</div>
	);
};

// ColorPicker component
interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	error?: string;
	showHexInput?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
															label,
															error,
															showHexInput = true,
															id,
															value,
															onChange,
															...rest
														}) => {
	const colorId = id || `color-${Math.random().toString(36).substring(2, 9)}`;
	const [hexValue, setHexValue] = React.useState(value as string || '#000000');

	// Handle color picker change
	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setHexValue(e.target.value);
		if (onChange) {
			onChange(e);
		}
	};

	// Handle hex input change
	const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setHexValue(newValue);

		// Create a synthetic event for the color picker
		if (onChange) {
			const syntheticEvent = {
				...e,
				target: {
					...e.target,
					value: newValue
				}
			} as React.ChangeEvent<HTMLInputElement>;

			onChange(syntheticEvent);
		}
	};

	return (
		<div className="form-group">
			{label && <label className="form-label" htmlFor={colorId}>{label}</label>}
			<div className="color-picker-container">
				<input
					type="color"
					id={colorId}
					className="form-color-picker"
					value={hexValue}
					onChange={handleColorChange}
					{...rest}
				/>
				{showHexInput && (
					<input
						type="text"
						value={hexValue}
						onChange={handleHexChange}
						className="form-input color-hex-input"
						pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
						title="Hex color code (e.g. #FF0000)"
					/>
				)}
			</div>
			{error && <div className="form-error">{error}</div>}
		</div>
	);
};

// Form component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
	onSubmit: (e: React.FormEvent) => void;
	className?: string;
}

export const Form: React.FC<FormProps> = ({
											  children,
											  onSubmit,
											  className = '',
											  ...rest
										  }) => {
	const formClasses = ['form', className].filter(Boolean).join(' ');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(e);
	};

	return (
		<form className={formClasses} onSubmit={handleSubmit} {...rest}>
			{children}
		</form>
	);
};

export { default as TimeInput } from './TimeInput';
