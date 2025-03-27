import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelBoardCard from '../ui/PixelBoardCard';
import { Input, Select } from '../ui/FormComponents';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import Button from '../ui/Button';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/MyBoardsPage.css';

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
	visitor: boolean;
}

enum TabType {
	CREATED = 'created',
	CONTRIBUTED = 'contributed'
}

const MyBoardsPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabType>(TabType.CREATED);
	const [createdBoards, setCreatedBoards] = useState<PixelBoard[]>([]);
	const [contributedBoards, setContributedBoards] = useState<PixelBoard[]>([]);
	const [loadingCreated, setLoadingCreated] = useState<boolean>(true);
	const [loadingContributed, setLoadingContributed] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [sortBy, setSortBy] = useState<string>('newest');
	const [filterBy, setFilterBy] = useState<string>('all');
	const { isLoggedIn, currentUser } = useAuth();
	const navigate = useNavigate();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
	useEffect(() => {
		if (!isLoggedIn) {
			console.log('MyBoardsPage: Utilisateur non connecté, redirection vers /login');
			navigate('/login', { state: { from: '/boards' } });
		}
	}, [isLoggedIn, navigate]);

	// Fetch user's created pixel boards
	useEffect(() => {
		// Ne charger les données que si l'utilisateur est connecté
		if (!isLoggedIn || !currentUser) return;

		const fetchMyCreatedBoards = async () => {
			setLoadingCreated(true);
			setError(null);
			try {
				// Récupérer le token d'authentification depuis localStorage
				const token = localStorage.getItem('token');

				const response = await fetch(`${API_URL}/api/pixelboards/my-boards`, {
					headers: {
						'Authorization': token ? `Bearer ${token}` : ''
					}
				});

				if (!response.ok) {
					throw new Error('Failed to fetch your boards');
				}
				const data = await response.json();
				setCreatedBoards(data);
			} catch (err) {
				console.error('Error fetching your created boards:', err);
				setError('Unable to load your boards. Please try again later.');
			} finally {
				setLoadingCreated(false);
			}
		};

		fetchMyCreatedBoards();
	}, [API_URL, isLoggedIn, currentUser]);

	// Fonction pour charger les boards où l'utilisateur a contribué
	const fetchMyContributedBoards = async () => {
		if (!isLoggedIn || !currentUser) return;

		setLoadingContributed(true);
		setError(null);
		try {
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/pixelboards/contributed-boards`, {
				headers: {
					'Authorization': token ? `Bearer ${token}` : ''
				}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch boards you contributed to');
			}

			const data = await response.json();

			// Ne plus filtrer les boards créés par l'utilisateur dans les boards avec contribution
			// Un utilisateur peut contribuer à ses propres boards
			setContributedBoards(data);
		} catch (err) {
			console.error('Error fetching your contributed boards:', err);
			setError('Unable to load boards you contributed to. Please try again later.');
		} finally {
			setLoadingContributed(false);
		}
	};

	// Charger les boards avec contribution lorsque l'utilisateur clique sur l'onglet
	useEffect(() => {
		if (activeTab === TabType.CONTRIBUTED && contributedBoards.length === 0 && !loadingContributed) {
			fetchMyContributedBoards();
		}
	}, [activeTab]);

	// Si l'utilisateur n'est pas connecté, on ne rend rien car la redirection sera effectuée
	if (!isLoggedIn) {
		return <Loader text="Redirecting to login..." />;
	}

	// Sort and filter options
	const sortOptions = [
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
		{ value: 'closing-soon', label: 'Closing Soon' },
		{ value: 'az', label: 'A-Z' },
		{ value: 'za', label: 'Z-A' }
	];

	const filterOptions = [
		{ value: 'all', label: 'All Boards' },
		{ value: 'active', label: 'Active Boards' },
		{ value: 'expired', label: 'Expired Boards' }
	];

	// Helper function to apply sorting and filtering
	const applySortAndFilter = (boards: PixelBoard[]) => {
		let result = [...boards];

		// Filter by search term
		if (searchTerm) {
			result = result.filter(board =>
				board.title.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Apply status filter
		if (filterBy !== 'all') {
			// Get current time for comparison
			const now = new Date();

			result = result.filter(board => {
				const creationDate = new Date(board.creationTime);
				const durationMs = board.time * 60 * 1000;
				const closingDate = new Date(creationDate.getTime() + durationMs);
				const isExpired = board.closeTime !== null || now > closingDate;

				if (filterBy === 'active') {
					return !isExpired;
				} else if (filterBy === 'expired') {
					return isExpired;
				}
				return true;
			});
		}

		// Sort the boards
		switch (sortBy) {
			case 'newest':
				return result.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
			case 'oldest':
				return result.sort((a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());
			case 'az':
				return result.sort((a, b) => a.title.localeCompare(b.title));
			case 'za':
				return result.sort((a, b) => b.title.localeCompare(a.title));
			case 'closing-soon':
				return result.sort((a, b) => {
					// Closed boards go to the end
					if (a.closeTime && !b.closeTime) return 1;
					if (!a.closeTime && b.closeTime) return -1;
					if (a.closeTime && b.closeTime) return 0;

					// Sort by time remaining
					const aEndTime = new Date(new Date(a.creationTime).getTime() + (a.time * 60 * 1000));
					const bEndTime = new Date(new Date(b.creationTime).getTime() + (b.time * 60 * 1000));
					return aEndTime.getTime() - bEndTime.getTime();
				});
			default:
				return result;
		}
	};

	// Get filtered and sorted boards based on active tab
	const filteredAndSortedBoards = applySortAndFilter(
		activeTab === TabType.CREATED ? createdBoards : contributedBoards
	);

	return (
		<Layout title="My Pixel Boards">
			{error && <Alert variant="error" message={error} />}

			<div className="my-boards-tabs">
				<button
					className={`tab-button ${activeTab === TabType.CREATED ? 'active' : ''}`}
					onClick={() => setActiveTab(TabType.CREATED)}
				>
					Boards I Created
				</button>
				<button
					className={`tab-button ${activeTab === TabType.CONTRIBUTED ? 'active' : ''}`}
					onClick={() => setActiveTab(TabType.CONTRIBUTED)}
				>
					Boards I Contributed To
				</button>
			</div>

			{activeTab === TabType.CONTRIBUTED && (
				<div className="tab-info">
					This tab shows all boards where you have placed at least one pixel, including boards you created yourself.
				</div>
			)}

			<div className="explore-filter">
				<div className="filter-options">
					<Select
						options={sortOptions}
						value={sortBy}
						onChange={setSortBy}
						fullWidth={false}
					/>

					<Select
						options={filterOptions}
						value={filterBy}
						onChange={setFilterBy}
						fullWidth={false}
					/>
				</div>

				<div className="search-box">
					<Input
						type="text"
						placeholder="Search boards..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						fullWidth={false}
					/>
				</div>
			</div>

			{(activeTab === TabType.CREATED && loadingCreated) ||
			(activeTab === TabType.CONTRIBUTED && loadingContributed) ? (
				<div className="board-grid-loading">
					<Loader text={`Loading ${activeTab === TabType.CREATED ? 'your' : 'contributed'} boards...`} />
				</div>
			) : filteredAndSortedBoards.length > 0 ? (
				<div className="board-grid">
					{filteredAndSortedBoards.map(board => (
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
						/>
					))}
				</div>
			) : (
				<div className="no-data">
					{searchTerm ?
						"No boards matching your search." :
						activeTab === TabType.CREATED ?
							"You haven't created any pixel boards yet. Click 'Create' to make your first board!" :
							"You haven't placed any pixels on any boards yet."
					}
				</div>
			)}

			{activeTab === TabType.CREATED && (
				<div className="create-board-button-container">
					<Button
						variant="primary"
						onClick={() => navigate('/create')}
						className="create-board-button"
					>
						Create New Board
					</Button>
				</div>
			)}
		</Layout>
	);
};

export default MyBoardsPage;
