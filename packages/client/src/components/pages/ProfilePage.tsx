import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DeleteConfirmation from '../profile/DeleteConfirmation';
import Layout from '../layout/Layout';
import '../../styles/pages/Profile.css'; // Utilise le CSS existant
import '../../styles/components/ActivityList.css'; // Pour les styles d'activité

// Service pour les appels API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserStats {
  pixelsPlaced: number;
  boardsCreated: number;
  boardsContributed: number;
  mostActiveBoard?: {
    id: string;
    title: string;
    pixelsPlaced: number;
  };
  joinDate: string;
}

interface ActivityItem {
  id: string;
  boardId: string;
  boardTitle: string;
  x: number;
  y: number;
  color: string;
  date: string;
}

const ProfilePage: React.FC = () => {
  const { currentUser, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Rediriger si non connecté
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isLoggedIn, navigate]);

  // Récupérer les stats de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Récupérer les statistiques de l'utilisateur
        const token = localStorage.getItem('token');
        const statsResponse = await fetch(`${API_URL}/api/users/${currentUser.id}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch user statistics');
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

        // Récupérer l'activité récente
        const activityResponse = await fetch(`${API_URL}/api/users/${currentUser.id}/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.recentPixels.slice(0, 5)); // Limiter à 5 éléments
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Unable to load your information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, API_URL]);

  // Gérer la déconnexion
  const handleLogout = () => {
    logout();
  };

  // Gérer le changement de mot de passe
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre le changement de mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Valider les mots de passe
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password');
      }

      setPasswordSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Masquer le formulaire après succès
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  // Gérer la suppression du compte
  const handleDeleteAccount = async () => {
    setShowDeleteAccount(true);
  };

  // Confirmer la suppression du compte
  const confirmDeleteAccount = async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Supprimer les données locales
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('roles');
      localStorage.removeItem('permissions');
      
      // Rediriger vers la page d'accueil
      navigate('/', { 
        state: { 
          message: 'Your account has been successfully deleted',
          messageType: 'success' 
        }
      });
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculer le temps relatif
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        Loading your profile...
      </div>
    );
  }

  // Contenu principal du profil à passer au Layout
  const profileContent = (
    <>
      <div className="profile-card">
        <h1 className="profile-title">Your Profile</h1>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        {passwordSuccess && (
          <div className="message success">
            {passwordSuccess}
          </div>
        )}

        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Username</span>
            <span className="info-value">{currentUser?.username}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{currentUser?.email}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Account Type</span>
            <span className="info-value">
              {currentUser?.roles.includes('admin') 
                ? 'Administrator' 
                : currentUser?.roles.includes('moderator') 
                  ? 'Moderator' 
                  : 'Regular User'}
            </span>
          </div>

          {stats?.joinDate && (
            <div className="info-row">
              <span className="info-label">Member Since</span>
              <span className="info-value">{formatDate(stats.joinDate)}</span>
            </div>
          )}

          {/* Section des statistiques */}
          <div className="stats-section">
            <h3>Your Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">{stats?.pixelsPlaced || 0}</div>
                <div className="stat-label">Pixels Placed</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats?.boardsCreated || 0}</div>
                <div className="stat-label">Boards Created</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats?.boardsContributed || 0}</div>
                <div className="stat-label">Boards Contributed</div>
              </div>
              {stats?.mostActiveBoard && (
                <div className="stat-box">
                  <div className="stat-value">{stats.mostActiveBoard.pixelsPlaced}</div>
                  <div className="stat-label">Most Active Board: {stats.mostActiveBoard.title}</div>
                </div>
              )}
            </div>
          </div>

          {/* Activité récente */}
          {recentActivity.length > 0 && (
            <div className="stats-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-color" style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      backgroundColor: activity.color,
                      marginRight: '8px',
                      borderRadius: '3px',
                    }}></div>
                    <span>
                      Placed pixel on <Link to={`/board/${activity.boardId}`} style={{ color: 'var(--accent-color)' }}>{activity.boardTitle}</Link> {getRelativeTime(activity.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="profile-actions">
            {showChangePassword ? (
              <button 
                className="btn-cancel" 
                onClick={() => setShowChangePassword(false)}
              >
                Cancel
              </button>
            ) : (
              <button 
                className="btn-edit" 
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </button>
            )}
            <button 
              className="btn-logout" 
              onClick={handleDeleteAccount}
              style={{ 
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: '#e53935',
                color: '#e53935' 
              }}
            >
              Delete Account
            </button>
          </div>

          {/* Formulaire de changement de mot de passe */}
          {showChangePassword && (
            <div className="form-section">
              <h3>Change Password</h3>
              {passwordError && (
                <div className="message error">
                  {passwordError}
                </div>
              )}
              <form className="profile-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="profile-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowChangePassword(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation de suppression de compte */}
      {showDeleteAccount && currentUser && (
        <DeleteConfirmation
          username={currentUser.username}
          onCancel={() => setShowDeleteAccount(false)}
          onConfirm={confirmDeleteAccount}
        />
      )}
    </>
  );

  return (
    <Layout title="My Profile">
      <div className="profile-content">
        {profileContent}
      </div>
    </Layout>
  );
};

export default ProfilePage;