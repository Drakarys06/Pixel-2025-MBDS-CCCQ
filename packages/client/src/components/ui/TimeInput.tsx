import React, { useState, useEffect } from 'react';
import '../../styles/ui/TimeInput.css';

interface TimeInputProps {
    label: string;
    value: number;
    onChange: (totalSeconds: number) => void;
    maxTime?: number;
    minTime?: number;
    required?: boolean;
    id?: string;
    name?: string;
    placeholder?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
    label,
    value,
    onChange,
    maxTime = 86400,
    minTime = 0,
    required = false,
    id,
    name,
    placeholder
}) => {
    // Convert initial seconds value to hours, minutes, seconds
    const [hours, setHours] = useState<number>(Math.floor(value / 3600));
    const [minutes, setMinutes] = useState<number>(Math.floor((value % 3600) / 60));
    const [seconds, setSeconds] = useState<number>(value % 60);
    const [isInternalChange, setIsInternalChange] = useState<boolean>(false);

    useEffect(() => {
        if (isInternalChange) {
            const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
            onChange(totalSeconds);
            setIsInternalChange(false);
        }
    }, [hours, minutes, seconds, onChange, isInternalChange]);

    useEffect(() => {
        const newHours = Math.floor(value / 3600);
        const newMinutes = Math.floor((value % 3600) / 60);
        const newSeconds = value % 60;

        const currentTotal = (hours * 3600) + (minutes * 60) + seconds;

        if (value !== currentTotal && !isInternalChange) {
            setHours(newHours);
            setMinutes(newMinutes);
            setSeconds(newSeconds);
        }
    }, [value, hours, minutes, seconds, isInternalChange]);

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHours = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (isNaN(newHours)) return;

        setIsInternalChange(true);

        // Validate max time
        const potentialTotalSeconds = (newHours * 3600) + (minutes * 60) + seconds;
        if (potentialTotalSeconds > maxTime) {
            const maxHours = Math.floor(maxTime / 3600);
            setHours(maxHours);
            return;
        }

        setHours(newHours);
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMinutes = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (isNaN(newMinutes) || newMinutes > 59) return;

        setIsInternalChange(true);

        // Validate max time
        const potentialTotalSeconds = (hours * 3600) + (newMinutes * 60) + seconds;
        if (potentialTotalSeconds > maxTime) {
            const remainingSeconds = maxTime - (hours * 3600);
            const maxMinutes = Math.floor(remainingSeconds / 60);
            setMinutes(maxMinutes);
            return;
        }

        setMinutes(newMinutes);
    };

    const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSeconds = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (isNaN(newSeconds) || newSeconds > 59) return;

        setIsInternalChange(true);

        // Validate max time
        const potentialTotalSeconds = (hours * 3600) + (minutes * 60) + newSeconds;
        if (potentialTotalSeconds > maxTime) {
            const remainingSeconds = maxTime - (hours * 3600) - (minutes * 60);
            setSeconds(remainingSeconds);
            return;
        }

        setSeconds(newSeconds);
    };

    const timeId = id || name || `time-input-${Math.random().toString(36).substring(2, 9)}`;

    return (
        <div className="time-input-container">
            <label className="time-input-label" htmlFor={timeId}>{label}</label>

            <div className="time-input-fields">
                <div className="time-input-field">
                    <input
                        type="number"
                        id={`${timeId}-hours`}
                        value={hours}
                        onChange={handleHoursChange}
                        min={0}
                        max={Math.floor(maxTime / 3600)}
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
                        max={59}
                        placeholder="0"
                        required={required}
                        className="time-input-number"
                    />
                    <span className="time-input-label-unit">min</span>
                </div>

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
            </div>
        </div>
    );
};

export default TimeInput;