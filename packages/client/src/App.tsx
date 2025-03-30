import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ui/ThemeContext';
import HomePage from './components/pages/HomePage';
import ExplorePage from './components/pages/ExplorePage';
import CreateBoardPage from './components/pages/CreateBoardPage';
import BoardViewPage from './components/pages/BoardViewPage';
import MyBoardsPage from './components/pages/MyBoardsPage';
import NotFoundPage from './components/pages/NotFoundPage';
import LoginPage from './components/pages/LoginPage';
import SignupPage from './components/pages/SignUpPage';
import TemporaryProfilePage from './components/pages/ProfilePage';
import UnauthorizedPage from './components/pages/UnauthorizedPage';
import ImageToPixelBoardPage from './components/pages/ImageToPixelBoardPage'; // Import our new component
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PermissionRoute from './components/auth/PermissionRoute';
import { PERMISSIONS } from './components/auth/permissions';

// Import global stylesheets
import './styles/index.css';
import './styles/colors.css';

// Fonction pour nettoyer les anciennes données d'authentification de localStorage
const cleanupLocalStorage = () => {
	// Vérifier s'il y a des données d'authentification dans localStorage
	const hasLocalStorageAuth = localStorage.getItem('token') ||
		localStorage.getItem('userId') ||
		localStorage.getItem('username');

	// Si on trouve des données, les supprimer
	if (hasLocalStorageAuth) {
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		localStorage.removeItem('username');
		console.log('Anciennes données d\'authentification supprimées de localStorage');
	}
};

const App: React.FC = () => {
	// Nettoyer les anciennes données de localStorage au démarrage
	useEffect(() => {
		// Commenté pour ne pas supprimer les données d'authentification à chaque rechargement
		// cleanupLocalStorage();
	}, []);

	return (
		<ThemeProvider>
			<AuthProvider>
				<Router>
					<div className="App">
						<Routes>
							{/* Routes publiques */}
							<Route path="/" element={<HomePage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/signup" element={<SignupPage />} />
							<Route path="/unauthorized" element={<UnauthorizedPage />} />

							{/* Route d'exploration - Protégée mais accessible aux visiteurs */}
							<Route path="/explore" element={<ExplorePage />} />

							{/* Board View - Accessible à tous, les permissions sont gérées à l'intérieur */}
							<Route path="/board/:id" element={<BoardViewPage />} />

							{/* Routes protégées avec permissions spécifiques */}
							<Route path="/create" element={
								<PermissionRoute permission={PERMISSIONS.BOARD_CREATE}>
									<CreateBoardPage />
								</PermissionRoute>
							} />

							{/* New route for image to pixel board */}
							<Route path="/create-from-image" element={
								<PermissionRoute permission={PERMISSIONS.BOARD_CREATE}>
									<ImageToPixelBoardPage />
								</PermissionRoute>
							} />

							<Route path="/boards" element={
								<ProtectedRoute>
									<MyBoardsPage />
								</ProtectedRoute>
							} />

							{/* Profil */}
							<Route path="/profile" element={<TemporaryProfilePage />} />

							{/* Route 404 */}
							<Route path="*" element={<NotFoundPage />} />
						</Routes>
					</div>
				</Router>
			</AuthProvider>
		</ThemeProvider>
	);
};

export default App;
