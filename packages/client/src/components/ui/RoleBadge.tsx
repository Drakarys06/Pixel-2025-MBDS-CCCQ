import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/permissions';
import '../../styles/ui/RoleBadge.css';

interface RoleBadgeProps {
  compact?: boolean;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ compact = false }) => {
  const { currentUser, hasRole } = useAuth();
  
  if (!currentUser) return null;
  
  // Déterminer le rôle principal à afficher (priorité admin > moderator > user > guest)
  const getMainRole = () => {
    if (hasRole(ROLES.ADMIN)) return { role: ROLES.ADMIN, label: 'Admin', className: 'role-admin' };
    if (hasRole(ROLES.MODERATOR)) return { role: ROLES.MODERATOR, label: 'Moderator', className: 'role-moderator' };
    if (hasRole(ROLES.USER)) return { role: ROLES.USER, label: 'User', className: 'role-user' };
    return { role: ROLES.GUEST, label: 'Guest', className: 'role-guest' };
  };
  
  const mainRole = getMainRole();
  
  return (
    <div className={`role-badge ${mainRole.className} ${compact ? 'compact' : ''}`}>
      {compact ? mainRole.label.charAt(0) : mainRole.label}
    </div>
  );
};

export default RoleBadge;