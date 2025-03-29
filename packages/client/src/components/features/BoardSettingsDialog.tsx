import React, { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import { Input, Checkbox } from '../ui/FormComponents';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import '../../styles/features/BoardSettingsDialog.css';

interface BoardSettingsProps {
	boardId: string;
	onClose: () => void;
	onSaved: () => void;
}

interface BoardSettings {
	title: string;
	visitor: boolean;
	redraw: boolean;
	closeTime: string | null;
}

const BoardSettingsDialog: React.FC<BoardSettingsProps> = ({ boardId, onClose, onSaved }) => {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<BoardSettings>({
		title: '',
		visitor: false,
		redraw: false,
		closeTime: null
	});
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [closeBoard, setCloseBoard] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Fetch board settings
	useEffect(() => {
		const fetchBoardSettings = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem('token');
				const response = await fetch(`${API_URL}/api/pixelboards/${boardId}`, {
					headers: {
						'Authorization': token ? `Bearer ${token}` : ''
					}
				});

				if (!response.ok) {
					throw new Error('Failed to fetch board settings');
				}

				const data = await response.json();
				setSettings({
					title: data.title,
					visitor: data.visitor,
					redraw: data.redraw,
					closeTime: data.closeTime
				});
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchBoardSettings();
	}, [boardId, API_URL]);

	// Handle clicks outside the dialog to close it
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	// Handle input changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;

		setSettings(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSaving(true);

		try {
			const token = localStorage.getItem('token');
			const updatedSettings = {
				...settings,
				closeTime: closeBoard ? new Date().toISOString() : settings.closeTime
			};

			const response = await fetch(`${API_URL}/api/pixelboards/${boardId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token ? `Bearer ${token}` : ''
				},
				body: JSON.stringify(updatedSettings)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update board settings');
			}

			setSuccess('Settings updated successfully!');

			// Notify parent component after a short delay
			setTimeout(() => {
				onSaved();
				onClose();
			}, 1500);
		} catch (err) {
			console.error('Error updating board settings:', err);
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="settings-dialog-overlay">
			<div className="settings-dialog" ref={dialogRef}>
				<div className="settings-dialog-header">
					<h2>Board Settings</h2>
					<button className="close-button" onClick={onClose}>×</button>
				</div>

				{loading ? (
					<div className="settings-dialog-loading">
						<Loader size="md" text="Loading board settings..." />
					</div>
				) : (
					<form onSubmit={handleSubmit} className="settings-form">
						{error && <Alert variant="error" message={error} />}
						{success && <Alert variant="success" message={success} />}

						<Input
							label="Board Title"
							name="title"
							value={settings.title}
							onChange={handleChange}
							required
							maxLength={100}
						/>

						<div className="settings-checkboxes">
							<Checkbox
								label="Allow users to redraw over existing pixels"
								name="redraw"
								checked={settings.redraw}
								onChange={handleChange}
							/>

							<Checkbox
								label="Enable visitor mode (view-only after time expires)"
								name="visitor"
								checked={settings.visitor}
								onChange={handleChange}
							/>
						</div>

						<div className="board-status-section">
							<h3>Board Status</h3>
							{settings.closeTime ? (
								<div className="board-closed-info">
									<p>This board is closed and can no longer be modified.</p>
									<p>Closed on: {new Date(settings.closeTime).toLocaleString()}</p>
								</div>
							) : (
								<div className="close-board-option">
									<Checkbox
										label="Close this board now (this action cannot be undone)"
										name="closeBoard"
										checked={closeBoard}
										onChange={(e) => setCloseBoard(e.target.checked)}
									/>
									{closeBoard && (
										<div className="warning-message">
											Warning: Closing the board will prevent any further modifications. This action cannot be undone.
										</div>
									)}
								</div>
							)}
						</div>

						<div className="settings-actions">
							<Button
								variant="secondary"
								onClick={onClose}
								disabled={saving}
							>
								Cancel
							</Button>
							<Button
								variant="primary"
								type="submit"
								disabled={saving || settings.closeTime !== null}
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default BoardSettingsDialog;
