import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Loader from '../ui/Loader';
import '../../styles/features/BoardContributors.css';

export interface Contributor {
	userId: string;
	username: string;
	pixelsCount: number;
	lastPixelTime: Date;
}

interface BoardContributorsProps {
	boardId: string;
	refreshTrigger?: number;
}

const BoardContributors: React.FC<BoardContributorsProps> = ({ boardId, refreshTrigger = 0 }) => {
	const [contributors, setContributors] = useState<Contributor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Fonction utilitaire pour formater les noms d'utilisateurs visiteurs
	const formatGuestUsername = (userId: string, username: string): string => {
		if (userId.startsWith('guest-') && (username === 'Guest' || !username)) {
			const guestNumber = userId.substring(6, 11);
			return `Guest-${guestNumber}`;
		}
		return 'Guest-' + userId.substring(6, 11);
	};

	// Fonction de récupération des contributeurs
	const fetchContributors = async () => {
		if (!boardId) return;

		setLoading(true);
		try {
			// Récupérer le token d'authentification
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/pixels/board/${boardId}/contributors`, {
				headers: {
					'Authorization': token ? `Bearer ${token}` : ''
				}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch contributors');
			}

			const data = await response.json();
			
			// Formater les noms des utilisateurs visiteurs avant de mettre à jour l'état
			const formattedContributors = data.map((contributor: Contributor) => ({
				...contributor,
				username: formatGuestUsername(contributor.userId, contributor.username)
			}));
			
			setContributors(formattedContributors);
		} catch (err) {
			console.error('Error fetching contributors:', err);
			setError(err instanceof Error ? err.message : 'Failed to load contributors');
		} finally {
			setLoading(false);
		}
	};

	// Rafraîchissement des contributeurs au chargement initial et quand refreshTrigger change
	useEffect(() => {
		fetchContributors();
	}, [boardId, API_URL, refreshTrigger]);

	// Calculer le total des pixels placés
	const totalPixels = contributors.reduce((sum, contributor) => sum + contributor.pixelsCount, 0);

	if (loading && contributors.length === 0) {
		return (
			<Card className="contributors-card">
				<div className="card-header">
					<h3 className="contributors-title">Board Contributors</h3>
				</div>
				<div className="card-body">
					<Loader size="sm" text="Loading contributors..." />
				</div>
			</Card>
		);
	}

	if (error && contributors.length === 0) {
		return (
			<Card className="contributors-card">
				<div className="card-header">
					<h3 className="contributors-title">Board Contributors</h3>
				</div>
				<div className="card-body">
					<div className="contributors-error">{error}</div>
				</div>
			</Card>
		);
	}

	return (
		<Card className="contributors-card">
			<div className="card-header">
				<div className="contributors-header">
					<h3 className="contributors-title">Board Contributors</h3>
					{loading && (
						<div className="refresh-indicator">
							<Loader size="sm" />
						</div>
					)}
				</div>
			</div>
			<div className="card-body">
				{contributors.length === 0 ? (
					<div className="no-contributors">
						No pixels have been placed on this board yet.
					</div>
				) : (
					<>
						<div className="contributors-stats">
							<div className="stat-item">
								<span className="stat-label">Total Pixels:</span>
								<span className="stat-value">{totalPixels}</span>
							</div>
							<div className="stat-item">
								<span className="stat-label">Total Contributors:</span>
								<span className="stat-value">{contributors.length}</span>
							</div>
						</div>

						<div className="contributors-table-container">
							<table className="contributors-table">
								<thead>
								<tr>
									<th>User</th>
									<th>Pixels Placed</th>
									<th>Contribution %</th>
								</tr>
								</thead>
								<tbody>
								{contributors.map((contributor) => (
									<tr key={contributor.userId}>
										<td>{contributor.username}</td>
										<td className="pixel-count">{contributor.pixelsCount}</td>
										<td className="contribution-percent">
											{totalPixels ? ((contributor.pixelsCount / totalPixels) * 100).toFixed(1) : 0}%
											<div
												className="contribution-bar"
												style={{
													width: `${totalPixels ? (contributor.pixelsCount / totalPixels) * 100 : 0}%`
												}}
											></div>
										</td>
									</tr>
								))}
								</tbody>
							</table>
						</div>
					</>
				)}
			</div>
		</Card>
	);
};

export default BoardContributors;