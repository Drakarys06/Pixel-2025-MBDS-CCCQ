import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/PixelBoard.css';
import './styles/HomePage.css';
import './styles/ExploreBoards.css';
import './styles/ThemeToggle.css';
import './styles/LoginPage.css';
import './styles/Profile.css';
import './styles/colors.css';
import HomePage from './components/HomePage';
import PixelBoardContainer from './components/PixelBoardContainer';
import ExploreBoards from './components/ExploreBoards';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignUpPage';
import ProfilePage from './components/ProfilePage';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExploreBoards />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Routes protégées */}
              <Route path="/create" element={
                <ProtectedRoute>
                  <PixelBoardContainer />
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
              <Route path="*" element={<div className="page-placeholder">Page not found</div>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;