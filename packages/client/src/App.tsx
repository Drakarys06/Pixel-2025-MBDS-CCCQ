import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ui/ThemeContext';
import HomePage from './components/pages/HomePage';
import ExplorePage from './components/pages/ExplorePage';
import CreateBoardPage from './components/pages/CreateBoardPage';
import BoardViewPage from './components/pages/BoardViewPage';
import NotFoundPage from './components/pages/NotFoundPage';
import LoginPage from './components/pages/LoginPage';
import SignupPage from './components/pages/SignUpPage';
import TemporaryProfilePage from './components/pages/ProfilePage';
import UnauthorizedPage from './components/pages/admin/UnauthorizedPage';
import AdminDashboard from './components/pages/admin/AdminDashboard';
import UserManagement from './components/pages/admin/UserManagement';
import RoleManagement from './components/pages/admin/RoleManagement';
import { AuthProvider } from './components/auth/AuthContext';
import PermissionRoute from './components/auth/PermissionRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PERMISSIONS } from './constants/permissions';
import './styles/index.css';
import './styles/colors.css';

// Fonction pour nettoyer les anciennes données d'authentification de localStorage
const cleanupLocalStorage = () => {
  // Vérifier s'il y a des données d'authentification dans localStorage
  const hasLocalStorageAuth = localStorage.getItem('token') || 
                             localStorage.getItem('userId') || 
                             localStorage.getItem('username');
  
  // Si on trouve des données mais pas de rôles ou permissions, les supprimer pour forcer une nouvelle connexion
  if (hasLocalStorageAuth && 
      (!localStorage.getItem('roles') || !localStorage.getItem('permissions'))) {
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Routes avec vérification de permission */}
              <Route path="/explore" element={
                <PermissionRoute permission={PERMISSIONS.BOARD_VIEW}>
                  <ExplorePage />
                </PermissionRoute>
              } />
              
              <Route path="/create" element={
                <PermissionRoute permission={PERMISSIONS.BOARD_CREATE}>
                  <CreateBoardPage />
                </PermissionRoute>
              } />
              
              <Route path="/board/:id" element={
                <PermissionRoute permission={PERMISSIONS.BOARD_VIEW}>
                  <BoardViewPage />
                </PermissionRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <TemporaryProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/boards" element={
                <ProtectedRoute>
                  <div className="page-placeholder">My Boards page coming soon</div>
                </ProtectedRoute>
              } />
              
              {/* Routes d'administration */}
              <Route path="/admin" element={
                <PermissionRoute permission={PERMISSIONS.ADMIN_ACCESS}>
                  <AdminDashboard />
                </PermissionRoute>
              } />
              
              <Route path="/admin/users" element={
                <PermissionRoute permission={PERMISSIONS.USER_VIEW}>
                  <UserManagement />
                </PermissionRoute>
              } />
              
              <Route path="/admin/roles" element={
                <PermissionRoute permission={PERMISSIONS.ROLE_MANAGE}>
                  <RoleManagement />
                </PermissionRoute>
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