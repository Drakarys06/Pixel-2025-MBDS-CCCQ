import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ui/ThemeContext';
import HomePage from './components/pages/HomePage';
import ExplorePage from './components/pages/ExplorePage';
import CreateBoardPage from './components/pages/CreateBoardPage';
import BoardViewPage from './components/pages/BoardViewPage';
import NotFoundPage from './components/pages/NotFoundPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignUpPage';
// Import the temporary profile page
import TemporaryProfilePage from './components/ProfilePage';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
    cleanupLocalStorage();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Routes protégées */}
              <Route path="/create" element={
                <ProtectedRoute>
                  <CreateBoardPage />
                </ProtectedRoute>
              } />
              <Route path="/board/:id" element={
                <ProtectedRoute>
                  <BoardViewPage />
                </ProtectedRoute>
              } />
              <Route path="/boards" element={
                <ProtectedRoute>
                  <div className="page-placeholder">My Boards page coming soon</div>
                </ProtectedRoute>
              } />
              
              {/* Use temporary profile page directly, not wrapped in ProtectedRoute */}
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