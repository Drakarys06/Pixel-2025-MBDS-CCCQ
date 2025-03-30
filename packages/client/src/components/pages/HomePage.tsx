// packages/client/src/components/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import Button from '../ui/Button';
import Card from '../ui/Card';
import PixelBoardCard from '../ui/PixelBoardCard';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import '../../styles/pages/HomePage.css';

interface PixelBoard {
	_id: string;
	title: string;
	length: number;
	width: number;
	time: number;
	redraw: boolean;
	closeTime: string | null;
	creationTime: string;
	creator: string;
	creatorUsername?: string;
}

interface HomeStats {
	userCount: number;
	boardCount: number;
	activeBoards: PixelBoard[];
	completedBoards: PixelBoard[];
}

const HomePage: React.FC = () => {
	const [stats, setStats] = useState<HomeStats | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	useEffect(() => {
		const fetchHomeData = async () => {
			setLoading(true);
			try {
				const response = await fetch(`${API_URL}/api/stats/home`);

				if (!response.ok) {
					throw new Error('Failed to fetch home page data');
				}

				const data = await response.json();
				setStats(data);
			} catch (err) {
				console.error('Error fetching home page data:', err);
				setError('Failed to load statistics. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		fetchHomeData();
	}, [API_URL]);

	return (
		<Layout showNavbar={true}>
			<div className="home-container">
				<div className="home-actions">
					<div className="home-stats">
						<Card className="stat-card">
							<div className="stat-value">{stats?.userCount || 0}</div>
							<div className="stat-label">Registered Users</div>
						</Card>
						<Card className="stat-card">
							<div className="stat-value">{stats?.boardCount || 0}</div>
							<div className="stat-label">Total Boards</div>
						</Card>
						<div className="create-button-container">
							<Link to="/create">
								<Button variant="primary" size="lg" className="create-button">Create New Board</Button>
							</Link>
							<Link to="/explore">
								<Button variant="secondary" size="lg" className="explore-button">Explore Boards</Button>
							</Link>
						</div>
					</div>
				</div>

				{loading ? (
					<div className="home-loading">
						<Loader size="md" text="Loading content..." />
					</div>
				) : error ? (
					<Alert variant="error" message={error} />
				) : stats && (
					<div className="home-boards-container">
						<div className="home-boards-section">
							<div className="section-header">
								<h2 className="section-title">Active Boards</h2>
								<div className="view-all-container">
									<Link to="/explore?filter=active" className="view-all-link">View All</Link>
								</div>
							</div>
							<div className="boards-grid">
								{stats.activeBoards.length > 0 ? (
									stats.activeBoards.map(board => (
										<PixelBoardCard
											key={board._id}
											id={board._id}
											title={board.title}
											width={board.width}
											length={board.length}
											creationTime={board.creationTime}
											time={board.time}
											closeTime={board.closeTime}
											creator={board.creatorUsername || board.creator}
											className="compact-card"
										/>
									))
								) : (
									<div className="no-boards">No active boards available</div>
								)}
							</div>
						</div>

						<div className="home-boards-section">
							<div className="section-header">
								<h2 className="section-title">Completed Boards</h2>
								<div className="view-all-container">
									<Link to="/explore?filter=expired" className="view-all-link">View All</Link>
								</div>
							</div>
							<div className="boards-grid">
								{stats.completedBoards.length > 0 ? (
									stats.completedBoards.map(board => (
										<PixelBoardCard
											key={board._id}
											id={board._id}
											title={board.title}
											width={board.width}
											length={board.length}
											creationTime={board.creationTime}
											time={board.time}
											closeTime={board.closeTime}
											creator={board.creatorUsername || board.creator}
											className="compact-card"
										/>
									))
								) : (
									<div className="no-boards">No completed boards yet</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
};

export default HomePage;
