import React, { useState, useEffect } from 'react';
import '../../styles/ui/TimeInput.css';

interface TimeInputProps {
	label: string;
	value: number; // Valeur totale en secondes
	onChange: (totalSeconds: number) => void;
	maxTime?: number;
	minTime?: number;
	required?: boolean;
	id?: string;
	name?: string;
	placeholder?: string;
	includeDays?: boolean; // Nouvelle propriété pour afficher les jours
}

const TimeInput: React.FC<TimeInputProps> = ({
												 label,
												 value,
												 onChange,
												 maxTime = 86400, // 24h par défaut
												 minTime = 0,
												 required = false,
												 id,
												 name,
												 placeholder,
												 includeDays = false
											 }) => {
	// Constantes pour les conversions
	const SECONDS_PER_DAY = 86400;
	const SECONDS_PER_HOUR = 3600;
	const SECONDS_PER_MINUTE = 60;

	// Limites
	const MAX_DAYS = 365; // Maximum 365 jours
	const maxDays = Math.min(MAX_DAYS, Math.floor(maxTime / SECONDS_PER_DAY));

	// Convertir les secondes en jours, heures, minutes, secondes
	const calculateTimeUnits = (totalSeconds: number) => {
		const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
		const remainingAfterDays = totalSeconds % SECONDS_PER_DAY;
		const hours = Math.floor(remainingAfterDays / SECONDS_PER_HOUR);
		const remainingAfterHours = remainingAfterDays % SECONDS_PER_HOUR;
		const minutes = Math.floor(remainingAfterHours / SECONDS_PER_MINUTE);
		const seconds = remainingAfterHours % SECONDS_PER_MINUTE;

		return { days, hours, minutes, seconds };
	};

	const initialTimeUnits = calculateTimeUnits(value);
	const [days, setDays] = useState<number>(initialTimeUnits.days);
	const [hours, setHours] = useState<number>(initialTimeUnits.hours);
	const [minutes, setMinutes] = useState<number>(initialTimeUnits.minutes);
	const [seconds, setSeconds] = useState<number>(initialTimeUnits.seconds);
	const [isInternalChange, setIsInternalChange] = useState<boolean>(false);

	// Mise à jour des états lorsque la valeur change
	useEffect(() => {
		if (!isInternalChange) {
			const timeUnits = calculateTimeUnits(value);
			setDays(timeUnits.days);
			setHours(timeUnits.hours);
			setMinutes(timeUnits.minutes);
			setSeconds(timeUnits.seconds);
		}
	}, [value, isInternalChange]);

	// Mise à jour de la valeur totale lorsque les états changent
	useEffect(() => {
		if (isInternalChange) {
			const totalSeconds = (days * SECONDS_PER_DAY) + (hours * SECONDS_PER_HOUR) + (minutes * SECONDS_PER_MINUTE) + seconds;
			if (totalSeconds >= minTime && totalSeconds <= maxTime) {
				onChange(totalSeconds);
			}
			setIsInternalChange(false);
		}
	}, [days, hours, minutes, seconds, onChange, minTime, maxTime, isInternalChange]);

	// Gestionnaires d'événements pour les champs
	const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDays = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		if (isNaN(newDays)) return;

		setIsInternalChange(true);
		setDays(Math.min(newDays, maxDays));
	};

	const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newHours = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		if (isNaN(newHours) || newHours > 23) return;

		setIsInternalChange(true);
		setHours(newHours);
	};

	const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newMinutes = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		if (isNaN(newMinutes) || newMinutes > 99) return; // Accepter jusqu'à 99 minutes

		setIsInternalChange(true);
		setMinutes(newMinutes);
	};

	const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSeconds = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		if (isNaN(newSeconds) || newSeconds > 59) return;

		setIsInternalChange(true);
		setSeconds(newSeconds);
	};

	const timeId = id || name || `time-input-${Math.random().toString(36).substring(2, 9)}`;

	return (
		<div className="time-input-container">
			<label className="time-input-label" htmlFor={timeId}>{label}</label>

			<div className="time-input-fields">
				{includeDays && (
					<div className="time-input-field">
						<input
							type="number"
							id={`${timeId}-days`}
							value={days}
							onChange={handleDaysChange}
							min={0}
							max={maxDays}
							placeholder="0"
							required={required}
							className="time-input-number"
						/>
						<span className="time-input-label-unit">days</span>
					</div>
				)}

				<div className="time-input-field">
					<input
						type="number"
						id={`${timeId}-hours`}
						value={hours}
						onChange={handleHoursChange}
						min={0}
						max={23}
						placeholder="0"
						required={required}
						className="time-input-number"
					/>
					<span className="time-input-label-unit">hours</span>
				</div>

				<div className="time-input-field">
					<input
						type="number"
						id={`${timeId}-minutes`}
						value={minutes}
						onChange={handleMinutesChange}
						min={0}
						max={99} // Accepter jusqu'à 99 minutes
						placeholder="0"
						required={required}
						className="time-input-number"
					/>
					<span className="time-input-label-unit">min</span>
				</div>

				{!includeDays && (
					<div className="time-input-field">
						<input
							type="number"
							id={`${timeId}-seconds`}
							value={seconds}
							onChange={handleSecondsChange}
							min={0}
							max={59}
							placeholder="0"
							required={required}
							className="time-input-number"
						/>
						<span className="time-input-label-unit">sec</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default TimeInput;
