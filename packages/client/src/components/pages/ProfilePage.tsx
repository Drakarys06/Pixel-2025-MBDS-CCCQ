import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/pages/Profile.css';

const TemporaryProfilePage: React.FC = () => {
	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		localStorage.removeItem('username');
		window.location.href = '/login';
	};

	return (
		<div className="profile-container">
			<header className="profile-header">
				<nav className="profile-nav">
					<Link to="/" className="profile-logo">PixelBoard</Link>

					<div className="nav-links">
						<Link to="/explore" className="nav-link">Explore</Link>
						<Link to="/create" className="nav-link">Create</Link>
						<Link to="/boards" className="nav-link">My Boards</Link>
					</div>

					<div className="nav-actions">
						<button className="btn-logout" onClick={handleLogout}>Log out</button>
					</div>
				</nav>
			</header>

			<div className="profile-content">
				<div className="profile-card">
					<h1 className="profile-title">Temporary Profile Page</h1>

					<div className="profile-info">
						<p>This is a temporary profile page while we fix some technical issues.</p>
						<p>Please check back later for your full profile details.</p>

						<div className="message info">
							We're currently updating our profile system. Thanks for your patience!
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TemporaryProfilePage;