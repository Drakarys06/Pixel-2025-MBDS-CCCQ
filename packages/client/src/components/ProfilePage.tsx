import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Profile.css';
import ThemeToggle from './ui/ThemeToggle';

interface UserProfile {
  username: string;
  email: string;
  pixelsPlaced: number;
  boardsCreated: number;
  joinDate: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
        setUsername(data.username);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage({ text: 'Failed to load profile. Please try again.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [API_URL, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    
    // Reset form values when canceling edit
    if (isEditing && profile) {
      setUsername(profile.username);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validate passwords if changing password
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update the profile after successful update
      setProfile(prev => prev ? { ...prev, username } : null);
      setMessage({ text: 'Profile updated successfully', type: 'success' });
      setIsEditing(false);
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An error occurred while updating your profile', 
        type: 'error' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <nav className="profile-nav">
          <Link to="/" className="profile-logo">PixelBoard</Link>
          
          <div className="nav-links">
            <Link to="/explore" className="nav-link">
              Explore
            </Link>
            <Link to="/create" className="nav-link">
              Create
            </Link>
            <Link to="/boards" className="nav-link">
              My Boards
            </Link>
          </div>
          
          <div className="nav-actions">
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          <h1 className="profile-title">My Profile</h1>
          
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {isEditing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input 
                  type="text" 
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-section">
                <h3>Change Password (optional)</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input 
                    type="password" 
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input 
                    type="password" 
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    disabled={!currentPassword}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    disabled={!currentPassword}
                  />
                </div>
              </div>
              
              <div className="profile-actions">
                <button type="button" className="btn-cancel" onClick={handleEditToggle}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              {profile && (
                <>
                  <div className="info-row">
                    <span className="info-label">Username:</span>
                    <span className="info-value">{profile.username}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{profile.email}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Joined:</span>
                    <span className="info-value">{new Date(profile.joinDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="stats-section">
                    <h3>Your Statistics</h3>
                    
                    <div className="stats-grid">
                      <div className="stat-box">
                        <div className="stat-value">{profile.pixelsPlaced}</div>
                        <div className="stat-label">Pixels Placed</div>
                      </div>
                      
                      <div className="stat-box">
                        <div className="stat-value">{profile.boardsCreated}</div>
                        <div className="stat-label">Boards Created</div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="btn-edit" onClick={handleEditToggle}>
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;