import { Request, Response, NextFunction } from 'express';
import { DEFAULT_ROLES } from '../services/roleService';
import Role from '../models/Role';

// Middleware qui vérifie les permissions
export const hasPermission = (permission: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required',
				redirectTo: '/login'
			});
		}

		try {
			if (req.isGuest) {
				const guestRole = await Role.findOne({ name: DEFAULT_ROLES.GUEST });
				if (!guestRole) {
					return res.status(403).json({
						success: false,
						message: 'Forbidden: Guest role not found'
					});
				}

				if (!guestRole.permissions.includes(permission)) {
					return res.status(403).json({
						success: false,
						message: 'Forbidden: Insufficient permissions for guest',
						redirectTo: '/login'
					});
				}

				return next();
			}

			const hasPermission = await req.user.hasPermission(permission);

			if (!hasPermission) {
				return res.status(403).json({
					success: false,
					message: 'Forbidden: Insufficient permissions'
				});
			}

			next();
		} catch (error) {
			console.error('Permission check error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during permission check'
			});
		}
	};
};

// Middleware qui vérifie les rôles
export const hasRole = (role: string | string[]) => {
	const roles = Array.isArray(role) ? role : [role];

	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required',
				redirectTo: '/login'
			});
		}

		try {
			if (req.isGuest) {
				if (!roles.includes(DEFAULT_ROLES.GUEST)) {
					return res.status(403).json({
						success: false,
						message: 'Forbidden: Guest role not authorized for this action',
						redirectTo: '/login'
					});
				}

				return next();
			}

			let hasRequiredRole = false;

			for (const roleName of roles) {
				if (await req.user.hasRole(roleName)) {
					hasRequiredRole = true;
					break;
				}
			}

			if (!hasRequiredRole) {
				return res.status(403).json({
					success: false,
					message: 'Forbidden: Insufficient role'
				});
			}

			next();
		} catch (error) {
			console.error('Role check error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during role check'
			});
		}
	};
};

// Middleware qui vérifie si l'utilisateur est le créateur de la ressource ou a les permissions appropriées
export const isResourceCreator = (getResourceFn: (req: Request) => Promise<any>, bypassPermission?: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required',
				redirectTo: '/login'
			});
		}

		try {
			const resource = await getResourceFn(req);

			if (!resource) {
				return res.status(404).json({
					success: false,
					message: 'Resource not found'
				});
			}

			if (bypassPermission && await req.user.hasPermission(bypassPermission)) {
				return next();
			}

			if (resource.creator && resource.creator.toString() === req.user._id.toString()) {
				return next();
			}

			return res.status(403).json({
				success: false,
				message: 'Forbidden: You are not the creator of this resource'
			});
		} catch (error) {
			console.error('Resource creator check error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during resource creator check'
			});
		}
	};
};
