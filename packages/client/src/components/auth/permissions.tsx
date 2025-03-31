// Définition des permissions côté client
// Ces constantes doivent correspondre exactement à celles définies dans le backend

// Permissions utilisateur
export const USER_VIEW = 'user:view';
export const USER_CREATE = 'user:create';
export const USER_UPDATE = 'user:update';
export const USER_DELETE = 'user:delete';

// Permissions de tableau
export const BOARD_VIEW = 'board:view';
export const BOARD_CREATE = 'board:create';
export const BOARD_UPDATE = 'board:update';
export const BOARD_DELETE = 'board:delete';

// Permissions de pixel
export const PIXEL_VIEW = 'pixel:view';
export const PIXEL_CREATE = 'pixel:create';
export const PIXEL_UPDATE = 'pixel:update';
export const PIXEL_DELETE = 'pixel:delete';

// Permissions administratives
export const ADMIN_ACCESS = 'admin:access';
export const ROLE_MANAGE = 'role:manage';

// Regroupement des permissions
export const PERMISSIONS = {
	// Permissions utilisateur
	USER_VIEW,
	USER_CREATE,
	USER_UPDATE,
	USER_DELETE,

	// Permissions de tableau
	BOARD_VIEW,
	BOARD_CREATE,
	BOARD_UPDATE,
	BOARD_DELETE,

	// Permissions de pixel
	PIXEL_VIEW,
	PIXEL_CREATE,
	PIXEL_UPDATE,
	PIXEL_DELETE,

	// Permissions administratives
	ADMIN_ACCESS,
	ROLE_MANAGE
};

// Rôles prédéfinis
export const ROLES = {
	ADMIN: 'admin',
	MODERATOR: 'moderator',
	USER: 'user',
	GUEST: 'guest'
};