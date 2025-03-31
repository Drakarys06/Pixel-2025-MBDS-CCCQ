import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../layout/Layout';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import '../../styles/pages/Profile.css';
import '../../styles/components/ActivityList.css';

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
  const { currentUser, isLoggedIn, isGuestMode, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not logged in or is a guest
  useEffect(() => {
    if (!isLoggedIn || isGuestMode) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isLoggedIn, isGuestMode, navigate]);

  // If user is a guest, show guest mode message
  if (isGuestMode) {
    return (
      <Layout title="Profile">
        <div className="guest-mode-message">
          <Alert
            variant="info"
            message="As a guest user, you don't have access to profile settings. Create an account to manage your profile!"
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

  // Rest of the original ProfilePage code remains the same as in the previous implementation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  // États pour le changement de mot de passe
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // États pour l'édition du profil
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || ''
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

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

  // Rest of the methods remain the same as in the previous implementation
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    // Valider les champs
    if (!profileData.username.trim() || !profileData.email.trim()) {
      setProfileError("Username and email are required");
      return;
    }

    // Validation simple de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setProfileError("Please enter a valid email address");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${currentUser?.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      
      if (result.success) {
        // Mettre à jour le contexte d'authentification
        updateUser({
          username: result.user.username,
          email: result.user.email
        });
      }

      setProfileSuccess('Profile updated successfully');

      // Masquer le formulaire après succès
      setTimeout(() => {
        setShowEditProfile(false);
        setProfileSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
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
      console.error("Error details:", err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
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

  return (
    <Layout title="Profile">
      <div className="profile-content">
        {/* Messages globaux */}
        <div className="profile-messages">
          {error && <div className="message error">{error}</div>}
          {passwordSuccess && <div className="message success">{passwordSuccess}</div>}
          {profileSuccess && <div className="message success">{profileSuccess}</div>}
        </div>

        {/* BLOC 1: Informations de base du profil */}
        <div className="profile-block profile-info-block">
          <h2 className="block-title">Profile Information</h2>
          <div className="profile-card">
            <div className="info-grid">
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
            </div>

            {/* Boutons d'action */}
            <div className="profile-actions">
              {showEditProfile ? (
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowEditProfile(false)}
                >
                  Cancel Edit
                </button>
              ) : (
                <button 
                  className="btn-edit" 
                  onClick={() => {
                    setProfileData({
                      username: currentUser?.username || '',
                      email: currentUser?.email || ''
                    });
                    setShowEditProfile(true);
                    setShowChangePassword(false);
                  }}
                >
                  Edit Profile
                </button>
              )}
              
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
                  onClick={() => {
                    setShowChangePassword(true);
                    setShowEditProfile(false);
                  }}
                >
                  Change Password
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BLOC 2: Statistiques de l'utilisateur */}
        <div className="profile-block stats-block">
          <h2 className="block-title">User Statistics</h2>
          <div className="stats-card">
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
        </div>

        {/* BLOC 3: Activité récente et formulaires */}
        <div className="profile-block activity-forms-block">
          <h2 className="block-title">Recent Activity & Settings</h2>
          <div className="activity-forms-card">
            {/* Section activité récente */}
            {recentActivity.length > 0 && (
              <div className="activity-section">
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

            {/* Formulaire d'édition de profil */}
            {showEditProfile && (
              <div className="form-section">
                <h3>Edit Profile Information</h3>
                {profileError && (
                  <div className="message error">
                    {profileError}
                  </div>
                )}
                <form className="profile-form" onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="profile-actions">
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => setShowEditProfile(false)}
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
      </div>
    </Layout>
  );
};

export default ProfilePage;