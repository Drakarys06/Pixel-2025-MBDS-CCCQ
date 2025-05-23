import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../layout/Layout';
import PixelBoardCard from '../ui/PixelBoardCard';
import { Input, Select } from '../ui/FormComponents';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import Button from '../ui/Button';
import { useAuth } from '../auth/AuthContext';
import PermissionGate from '../auth/PermissionGate';
import { PERMISSIONS } from '../auth/permissions';
import '../../styles/pages/ExplorePage.css';

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

const ExplorePage: React.FC = () => {
	const [pixelBoards, setPixelBoards] = useState<PixelBoard[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [sortBy, setSortBy] = useState<string>('closing-soon');
	const [filterBy, setFilterBy] = useState<string>('all');
	const { isLoggedIn, isGuestMode } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	// Set filter param from URL if provided
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const filterParam = params.get('filter');
		if (filterParam && ['all', 'active', 'expired'].includes(filterParam)) {
			setFilterBy(filterParam);
		}
	}, [location.search]);

	// Fetch pixel boards
	useEffect(() => {
		const fetchPixelBoards = async () => {
			setLoading(true);
			setError(null);
			try {
				const token = localStorage.getItem('token');

				const response = await fetch(`${API_URL}/api/pixelboards`, {
					headers: {
						'Authorization': token ? `Bearer ${token}` : ''
					}
				});

				if (!response.ok) {
					throw new Error('Failed to fetch pixel boards');
				}
				const data = await response.json();
				setPixelBoards(data);
			} catch (err) {
				console.error('Error fetching pixel boards:', err);
				setError('Unable to load boards. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		fetchPixelBoards();
	}, [API_URL]);

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

	// Function to check if a board is expired
	const isBoardExpired = (board: PixelBoard): boolean => {
		const now = new Date();
		if (board.closeTime) return true;

		const creationDate = new Date(board.creationTime);
		const durationMs = board.time * 60 * 1000;
		const closingDate = new Date(creationDate.getTime() + durationMs);

		return now > closingDate;
	};

	// Sort and filter the boards
	const filteredAndSortedBoards = React.useMemo(() => {
		let result = [...pixelBoards];
	
		// Filter by search term
		if (searchTerm) {
			result = result.filter(board =>
				board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(board.creatorUsername ?
					board.creatorUsername.toLowerCase().includes(searchTerm.toLowerCase()) :
					board.creator.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		}
	
		// Apply status filter
		if (filterBy !== 'all') {
			result = result.filter(board => {
				const isExpired = isBoardExpired(board);
	
				if (filterBy === 'active') {
					return !isExpired;
				} else if (filterBy === 'expired') {
					return isExpired;
				}
				return true;
			});
		}
	
		// Filter boards that require authentication for visitors
		if (!isLoggedIn) {
			result = result.filter(board => board.visitor);
		}
	
		// Tag each board with its active status and remaining time
		const now = new Date();
		const taggedResults = result.map(board => {
			const creationTime = new Date(board.creationTime).getTime();
			const endTime = creationTime + (board.time * 60 * 1000);
			const isExpired = board.closeTime !== null || endTime < now.getTime();
			const timeRemaining = isExpired ? 0 : endTime - now.getTime();
	
			return {
				board,
				isActive: !isExpired,
				timeRemaining
			};
		});
	
		// Sort the boards
		let sortedResults;
		switch (sortBy) {
			case 'newest':
				sortedResults = taggedResults.sort((a, b) =>
					new Date(b.board.creationTime).getTime() - new Date(a.board.creationTime).getTime()
				);
				break;
			case 'oldest':
				sortedResults = taggedResults.sort((a, b) =>
					new Date(a.board.creationTime).getTime() - new Date(b.board.creationTime).getTime()
				);
				break;
			case 'az':
				sortedResults = taggedResults.sort((a, b) =>
					a.board.title.localeCompare(b.board.title)
				);
				break;
			case 'za':
				sortedResults = taggedResults.sort((a, b) =>
					b.board.title.localeCompare(a.board.title)
				);
				break;
			case 'closing-soon':
				// For closing-soon, first sort by active status, then by time remaining
				sortedResults = taggedResults.sort((a, b) => {
					// First separate active from inactive boards
					if (!a.isActive && b.isActive) return 1;
					if (a.isActive && !b.isActive) return -1;
					if (!a.isActive && !b.isActive) return 0;
	
					// Sort active boards by time remaining (ascending)
					return a.timeRemaining - b.timeRemaining;
				});
				break;
			default:
				sortedResults = taggedResults;
		}
	
		// Return just the boards without the tags
		return sortedResults.map(item => item.board);
	}, [pixelBoards, searchTerm, sortBy, filterBy, isLoggedIn]);

	return (
		<Layout title="Explore Pixel Boards">
			{error && <Alert variant="error" message={error} />}

			{isGuestMode && (
				<Alert
					variant="info"
					message="You're browsing as a guest. Some boards may be restricted. Sign up for full access!"
					dismissible
				/>
			)}

			<div className="explore-filter">
				<div className="filter-options">
					<Select
						options={sortOptions}
						value={sortBy}
						onChange={setSortBy}
						fullWidth={false}
						className="sort-select"
					/>

					<Select
						options={filterOptions}
						value={filterBy}
						onChange={setFilterBy}
						fullWidth={false}
						className="filter-select"
					/>
				</div>

				<div className="search-box">
					<Input
						type="text"
						placeholder="Search boards..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						fullWidth={false}
						className="search-input"
					/>
				</div>
			</div>

			<div className="explore-actions">
				<PermissionGate
					permission={PERMISSIONS.BOARD_CREATE}
					fallback={
						<div className="permission-note">
							{!isLoggedIn ? (
								<span>
									<a href="/login" className="text-link">Log in</a> or <a href="/signup" className="text-link">sign up</a> to create your own boards!
								</span>
							) : (
								<span>Your current role doesn&apos;t allow board creation.</span>
							)}
						</div>
					}
				>
					<Button
						variant="primary"
						onClick={() => navigate('/create')}
						className="create-board-button"
					>
						Create New Board
					</Button>
				</PermissionGate>
			</div>

			{loading ? (
				<div className="board-grid-loading">
					<Loader text="Loading boards..." />
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
					{searchTerm ? (
						"No pixel boards found matching your search."
					) : filterBy !== 'all' ? (
						`No ${filterBy} pixel boards available.`
					) : !isLoggedIn ? (
						"No boards available for guest viewing. Please log in to see more boards."
					) : (
						"No pixel boards available yet. Be the first to create one!"
					)}
				</div>
			)}
		</Layout>
	);
};

export default ExplorePage;
