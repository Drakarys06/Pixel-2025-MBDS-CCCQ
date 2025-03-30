// UserProfileButton.tsx
import React from 'react';
import { useAuth } from '../auth/AuthContext';
import '../styles/ui/UserProfileButton.css';

const UserProfileButton: React.FC = () => {
  const { currentUser, isGuestMode } = useAuth();
  
  if (!currentUser) return null;
  
  // Obtenir la première lettre du nom d'utilisateur pour l'avatar
  const avatarLetter = currentUser.username.charAt(0).toUpperCase();
  
  // Déterminer les classes CSS en fonction du mode invité
  const avatarClass = isGuestMode ? 'avatar-guest' : 'avatar-user';
  const badgeClass = isGuestMode ? 'badge-guest' : 'badge-user';
  const badgeText = isGuestMode ? 'GUEST' : 'USER';
  
  return (
    <div className="profile-button">
      <div className={`user-avatar ${avatarClass}`}>
        {avatarLetter}
      </div>
      <div className="user-info">
        <span className="username">{currentUser.username}</span>
        <span className={`role-badge ${badgeClass}`}>{badgeText}</span>
      </div>
    </div>
  );
};

export default UserProfileButton;