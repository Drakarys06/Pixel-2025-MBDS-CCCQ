import express, { Request, Response } from 'express';
import { articleAPI } from './routes/article';
import { pixelBoardAPI } from './routes/pixelboard';
import { pixelAPI } from './routes/pixel';
import authRoutes from './routes/auth';
import { auth, optionalAuth } from './middleware/auth';
import cors from 'cors';

export const api = express.Router();

// Configuration CORS plus permissive pour éviter les problèmes d'en-têtes
api.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Routes publiques (pas besoin d'authentification)
api.use('/auth', authRoutes);

// Route de base - rediriger vers la connexion si non authentifié
api.get('/', optionalAuth, (req: Request, res: Response) => {
  if (req.user) {
    res.json({ response: 'Hello World!' });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Authentification requise',
      redirectTo: '/login'
    });
  }
});

// Routes avec authentication OPTIONNELLE - Permettre l'accès en lecture même sans token
api.use('/pixelboards', optionalAuth, pixelBoardAPI);
api.use('/pixels', optionalAuth, pixelAPI);

// Routes protégées (nécessitant une authentification complète)
api.use('/articles', auth, articleAPI);

// Route pour vérifier l'authentification de l'utilisateur
api.get('/check-auth', optionalAuth, (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        pixelsPlaced: req.user.pixelsPlaced,
        boardsCreated: req.user.boardsCreated
      }
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});