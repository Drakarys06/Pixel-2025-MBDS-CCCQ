import express, { Request, Response } from 'express';
import { articleAPI } from './routes/article';
import { pixelBoardAPI } from './routes/pixelboard';
import { pixelAPI } from './routes/pixel';
import { adminAPI } from './routes/admin';
import authRoutes from './routes/auth';
import statsRoutes from './routes/stats';
import { auth, optionalAuth } from './middleware/auth';
import cors from 'cors';
import * as roleService from './services/roleService';

export const api = express.Router();

// Configuration CORS plus permissive pour éviter les problèmes d'en-têtes
api.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true
}));

// Route pour initialiser les rôles par défaut
api.get('/init-roles', async (req: Request, res: Response) => {
	try {
		await roleService.initializeDefaultRoles();
		res.json({
			success: true,
			message: 'Default roles initialized successfully',
			availablePermissions: roleService.PERMISSIONS
		});
	} catch (error) {
		console.error('Error initializing roles:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to initialize default roles'
		});
	}
});

// Routes publiques (pas besoin d'authentification)
api.use('/auth', authRoutes);
api.use('/stats', statsRoutes);

// Route de base - rediriger vers la connexion si non authentifié
api.get('/', optionalAuth, (req: Request, res: Response) => {
	if (req.user) {
		res.json({
			success: true,
			message: 'API is running',
			user: {
				id: req.user._id,
				username: req.user.username,
				isGuest: req.isGuest
			}
		});
	} else {
		res.status(401).json({
			success: false,
			message: 'Authentication required',
			redirectTo: '/login'
		});
	}
});

// Routes avec authentication OPTIONNELLE - Permettre l'accès en lecture même sans token
api.use('/pixelboards', pixelBoardAPI);
api.use('/pixels', pixelAPI);

// Routes protégées (nécessitant une authentification complète)
api.use('/articles', auth, articleAPI);
api.use('/admin', auth, adminAPI);

// Route pour vérifier l'authentification de l'utilisateur
api.get('/check-auth', optionalAuth, async (req: Request, res: Response) => {
	if (!req.user) {
		return res.json({
			authenticated: false
		});
	}

	// Si l'utilisateur est un visiteur
	if (req.isGuest) {
		return res.json({
			authenticated: true,
			isGuest: true,
			user: {
				id: req.user._id,
				username: req.user.username,
				roles: ['guest'],
				permissions: ['board:view', 'pixel:view']
			}
		});
	}

	// Si l'utilisateur est authentifié, récupérer ses rôles et permissions
	try {
		const user = await req.user.populate('roles');

		const roles = user.roles.map((role: any) => role.name);

		const permissions = user.roles.reduce((acc: string[], role: any) => {
			return [...acc, ...role.permissions];
		}, []);

		const uniquePermissions = [...new Set(permissions)];

		res.json({
			authenticated: true,
			isGuest: false,
			user: {
				id: req.user._id,
				username: req.user.username,
				email: req.user.email,
				pixelsPlaced: req.user.pixelsPlaced,
				boardsCreated: req.user.boardsCreated,
				roles,
				permissions: uniquePermissions
			}
		});
	} catch (error) {
		console.error('Error retrieving user roles and permissions:', error);
		res.status(500).json({
			success: false,
			message: 'Error retrieving user information'
		});
	}
});