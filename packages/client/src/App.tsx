import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ui/ThemeContext';
import HomePage from './components/pages/HomePage';
import ExplorePage from './components/pages/ExplorePage';
import CreateBoardPage from './components/pages/CreateBoardPage';
import BoardViewPage from './components/pages/BoardViewPage';
import NotFoundPage from './components/pages/NotFoundPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignUpPage';
import ProfilePage from './components/ProfilePage';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
// Import global stylesheets
import './styles/index.css';
import './styles/colors.css';

const App: React.FC = () => {
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
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
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