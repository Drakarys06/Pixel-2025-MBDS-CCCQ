import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// JWT Secret (devrait être dans les variables d'environnement en production)
const JWT_SECRET = 'pixelboard-secret-key-change-in-production';

declare global {
	namespace Express {
		interface Request {
			user?: any;
			token?: string;
			isGuest?: boolean;
		}
	}
}

// Middleware d'authentification
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');

		if (!token) {
			res.status(401).json({
				success: false,
				message: 'Authentication required',
				redirectTo: '/login'
			});
			return;
		}

		if (token.startsWith('guest-')) {
			const guestNumber = token.substring(6, 11);
			const guestUsername = `Guest-${guestNumber}`;
			req.user = {
				_id: token,
				username: guestUsername,
				roles: ['guest']
			};
			req.isGuest = true;
			req.token = token;
			return next();
		}

		const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

		const user = await User.findById(decoded.id).select('-password').populate('roles');

		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		req.user = user;
		req.token = token;
		req.isGuest = false;

		next();
	} catch (error) {
		console.error('Authentication error:', error);
		res.status(401).json({
			success: false,
			message: 'Invalid token',
			redirectTo: '/login'
		});
	}
};

// Middleware d'authentification optionnel (pour les routes accessibles aux visiteurs)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');

		if (!token) {
			return next();
		}

		if (token.startsWith('guest-')) {
			const guestNumber: string = token.substring(6, 11);
			const guestUsername = `Guest-${guestNumber}`;
			req.user = {
				_id: token,
				username: guestUsername,
				roles: ['guest']
			};
			req.isGuest = true;
			req.token = token;
			return next();
		}

		try {
			const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

			const user = await User.findById(decoded.id).select('-password').populate('roles');

			if (user) {
				req.user = user;
				req.token = token;
				req.isGuest = false;
			}
		} catch (err) {
		}

		next();
	} catch (error) {
		next();
	}
};