import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import * as roleService from '../services/roleService';
import { auth } from '../middleware/auth';

const router = express.Router();

// JWT Secret (devrait être dans les variables d'environnement en production)
const JWT_SECRET = 'pixelboard-secret-key-change-in-production';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Email or username already in use
 */
router.post('/signup', async (req: Request, res: Response) => {
	try {
		const { username, email, password } = req.body;

		const existingUser = await User.findOne({
			$or: [{ email }, { username }]
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'Email ou nom d utilisateur déjà utilisé'
			});
		}

		const user = new User({
			username,
			email,
			password,
			roles: []
		});

		await user.save();

		const userId = user._id instanceof mongoose.Types.ObjectId
			? user._id.toString()
			: String(user._id);

		const defaultRoleResult = await roleService.assignDefaultRoleToUser(userId);

		const userWithRoles = await User.findById(userId).populate('roles');

		const roles = userWithRoles?.roles.map((role: any) => role.name) || [];
		const permissions = userWithRoles?.roles.reduce((acc: string[], role: any) => {
			return [...acc, ...role.permissions];
		}, []) || [];

		const uniquePermissions = [...new Set(permissions)];

		const token = jwt.sign(
			{ id: userId },
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

		res.status(201).json({
			success: true,
			message: 'Inscription réussie',
			token,
			userId: userId,
			username: user.username,
			roles,
			permissions: uniquePermissions
		});
	} catch (error) {
		console.error('Erreur d\'inscription:', error);
		res.status(500).json({
			success: false,
			message: 'Erreur lors de l\'inscription'
		});
	}
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		console.log('Tentative de connexion avec:', { email });

		// Trouver l'utilisateur par email
		const user = await User.findOne({ email }).populate('roles');
		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Email ou mot de passe incorrect'
			});
		}

		// Vérifier le mot de passe
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: 'Email ou mot de passe incorrect'
			});
		}

		// Extraire les noms de rôles et les permissions
		const roles = user.roles.map((role: any) => role.name);
		const permissions = user.roles.reduce((acc: string[], role: any) => {
			return [...acc, ...role.permissions];
		}, []);

		// Filtrer les permissions pour n'avoir que des valeurs uniques
		const uniquePermissions = [...new Set(permissions)];

		// Générer un token JWT
		const userId = user._id instanceof mongoose.Types.ObjectId
			? user._id.toString()
			: String(user._id);

		const token = jwt.sign(
			{ id: userId },
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

		res.status(200).json({
			success: true,
			message: 'Connexion réussie',
			token,
			userId: userId,
			username: user.username,
			roles,
			permissions: uniquePermissions
		});
	} catch (error) {
		console.error('Erreur de connexion:', error);
		res.status(500).json({
			success: false,
			message: 'Erreur lors de la connexion'
		});
	}
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify user token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or expired token
 */
router.get('/verify', auth, async (req: Request, res: Response) => {
	try {
		// Trouver l'utilisateur avec ses rôles
		const user = await User.findById(req.user._id).select('-password').populate('roles');

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Utilisateur non trouvé'
			});
		}

		// Extraire les noms de rôles et les permissions
		const roles = user.roles.map((role: any) => role.name);
		const permissions = user.roles.reduce((acc: string[], role: any) => {
			return [...acc, ...role.permissions];
		}, []);

		// Filtrer les permissions pour n'avoir que des valeurs uniques
		const uniquePermissions = [...new Set(permissions)];

		const userId = user._id instanceof mongoose.Types.ObjectId
			? user._id.toString()
			: String(user._id);

		res.status(200).json({
			success: true,
			message: 'Token valide',
			user: {
				id: userId,
				username: user.username,
				email: user.email,
				pixelsPlaced: user.pixelsPlaced,
				boardsCreated: user.boardsCreated,
				roles,
				permissions: uniquePermissions
			}
		});
	} catch (error) {
		console.error('Erreur de vérification du token:', error);
		res.status(401).json({
			success: false,
			message: 'Token invalide ou expiré'
		});
	}
});

/**
 * @swagger
 * /api/auth/guest-login:
 *   post:
 *     summary: Login as guest
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Guest login successful
 *       500:
 *         description: Server error
 */
router.post('/guest-login', async (req: Request, res: Response) => {
	try {
		// Trouver le rôle de visiteur
		const guestRole = await roleService.getRoleByName(roleService.DEFAULT_ROLES.GUEST);

		if (!guestRole) {
			return res.status(500).json({
				success: false,
				message: 'Rôle de visiteur non trouvé'
			});
		}

		// Générer un identifiant et un token de visiteur
		const guestId = 'guest-' + Math.random().toString(36).substring(2, 15);
		const guestToken = 'guest-' + Math.random().toString(36).substring(2, 15);
		const guestUsername = 'Visiteur-' + Math.floor(Math.random() * 10000);

		res.status(200).json({
			success: true,
			message: 'Connexion visiteur réussie',
			token: guestToken,
			userId: guestId,
			username: guestUsername,
			roles: [guestRole.name],
			permissions: guestRole.permissions
		});
	} catch (error) {
		console.error('Erreur de connexion visiteur:', error);
		res.status(500).json({
			success: false,
			message: 'Erreur lors de la connexion visiteur'
		});
	}
});

export default router;