import { useAuth } from './AuthContext';
import { PERMISSIONS, ROLES } from './permissions';

/** Hook pour vérifier les permissions et rôles de l'utilisateur. */
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

		isCreator: (creatorId: string) => currentUser?.id === creatorId,

		// Permission conditionnelle
		canModifyResource: (creatorId: string, permission: string) =>
			(currentUser?.id === creatorId) || hasPermission(permission),
		canUpdateOwnBoard: (creatorId: string) =>
			(currentUser?.id === creatorId) || hasPermission(PERMISSIONS.BOARD_UPDATE)
	};
}

export default usePermissions;
