import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelBoardCard from '../ui/PixelBoardCard';
import { Input, Select } from '../ui/FormComponents';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import Button from '../ui/Button';
import BoardSettingsDialog from '../features/BoardSettingsDialog';
import { useAuth } from '../auth/AuthContext';
import usePermissions from '../auth/usePermissions';
import PermissionGate from '../auth/PermissionGate';
import { PERMISSIONS } from '../auth/permissions';
import '../../styles/pages/MyBoardsPage.css';
import '../../styles/features/BoardSettingsDialog.css';

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
	const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
	const { isLoggedIn, currentUser, isGuestMode } = useAuth();
	const permissions = usePermissions();
	const navigate = useNavigate();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Redirect to login if user is not logged in
	useEffect(() => {
		if (!isLoggedIn) {
			console.log('MyBoardsPage: Utilisateur non connecté, redirection vers /login');
			navigate('/login', { state: { from: '/boards' } });
		}
	}, [isLoggedIn, navigate]);

	// Fetch user's created pixel boards
	const fetchMyCreatedBoards = async () => {
		// Only load data if user is logged in
		if (!isLoggedIn || !currentUser) return;

		setLoadingCreated(true);
		setError(null);
		try {
			// Get auth token from localStorage
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

	// Load created boards on initial render
	useEffect(() => {
		fetchMyCreatedBoards();
	}, [API_URL, isLoggedIn, currentUser]);

	// Fetch boards where user has contributed
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
			setContributedBoards(data);
		} catch (err) {
			console.error('Error fetching your contributed boards:', err);
			setError('Unable to load boards you contributed to. Please try again later.');
		} finally {
			setLoadingContributed(false);
		}
	};

	// Load contributed boards when user switches to that tab
	useEffect(() => {
		if (activeTab === TabType.CONTRIBUTED && contributedBoards.length === 0 && !loadingContributed) {
			fetchMyContributedBoards();
		}
	}, [activeTab]);

	// If user is not logged in, show nothing as redirect will happen
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

	// Handle settings button click
	const handleSettingsClick = (boardId: string) => {
		setSelectedBoardId(boardId);
	};

	// Handle dialog close
	const handleCloseSettings = () => {
		setSelectedBoardId(null);
	};

	// Handle settings saved
	const handleSettingsSaved = () => {
		// Refresh the boards list to show updated settings
		fetchMyCreatedBoards();
	};

	// Get filtered and sorted boards based on active tab
	const filteredAndSortedBoards = applySortAndFilter(
		activeTab === TabType.CREATED ? createdBoards : contributedBoards
	);

	// Check if user is a guest - guests don't have boards
	if (isGuestMode) {
		return (
			<Layout title="My Pixel Boards">
				<div className="guest-mode-message">
					<Alert
						variant="info"
						message="As a guest user, you don't have your own board collection. Create an account to start creating and managing boards!"
					/>
					<div className="guest-actions">
						<Button
							variant="primary"
							onClick={() => navigate('/signup')}
						>
							Create Account
						</Button>
						<Button
							variant="secondary"
							onClick={() => navigate('/explore')}
						>
							Explore Boards
						</Button>
					</div>
				</div>
			</Layout>
		);
	}

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
						// Dans la section qui rend chaque carte (PixelBoardCard)
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
							// Show settings button for boards created by the user when in the "Created" tab
							// The user can always modify their own boards, or if they have update permission
							showSettings={activeTab === TabType.CREATED && permissions.canUpdateOwnBoard(board.creator)}
							onSettingsClick={handleSettingsClick}
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
				<PermissionGate permission={PERMISSIONS.BOARD_CREATE}>
					<div className="create-board-button-container">
						<Button
							variant="primary"
							onClick={() => navigate('/create')}
							className="create-board-button"
						>
							Create New Board
						</Button>
					</div>
				</PermissionGate>
			)}

			{/* Settings Dialog */}
			{selectedBoardId && (
				<BoardSettingsDialog
					boardId={selectedBoardId}
					onClose={handleCloseSettings}
					onSaved={handleSettingsSaved}
				/>
			)}
		</Layout>
	);
};

export default MyBoardsPage;
