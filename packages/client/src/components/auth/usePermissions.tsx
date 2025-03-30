// usePermissions.tsx
import { useAuth } from './AuthContext';
import { PERMISSIONS, ROLES } from './permissions';

/**
 * Un hook personnalisé qui fournit des fonctions utilitaires pour vérifier les permissions
 * et les rôles de l'utilisateur courant.
 */
export function usePermissions() {
  const { hasPermission, hasRole, currentUser, isGuestMode } = useAuth();

  return {
    // Vérification des permissions spécifiques
    canCreateBoard: () => hasPermission(PERMISSIONS.BOARD_CREATE),
    canUpdateBoard: () => hasPermission(PERMISSIONS.BOARD_UPDATE),
    canDeleteBoard: () => hasPermission(PERMISSIONS.BOARD_DELETE),
    canCreatePixel: () => hasPermission(PERMISSIONS.PIXEL_CREATE),
    canDeletePixel: () => hasPermission(PERMISSIONS.PIXEL_DELETE),
    
    // Vérification des rôles
    isAdmin: () => hasRole(ROLES.ADMIN),
    isModerator: () => hasRole(ROLES.MODERATOR),
    isGuest: () => isGuestMode,
    
    // Informations sur l'utilisateur
    getUserId: () => currentUser?.id,
    getUsername: () => currentUser?.username,
    
    // Helper pour vérifier si l'utilisateur est le créateur d'une ressource
    isCreator: (creatorId: string) => currentUser?.id === creatorId,
    
    // Permission conditionnelle (si créateur OU permission spécifique)
    canModifyResource: (creatorId: string, permission: string) => 
      (currentUser?.id === creatorId) || hasPermission(permission)
  };
}

export default usePermissions;