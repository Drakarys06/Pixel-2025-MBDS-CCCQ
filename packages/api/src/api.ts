
// Modifier le fichier api.ts pour protéger toutes les routes
import express, { Request, Response } from 'express';
import { articleAPI } from './routes/article';
import { pixelBoardAPI } from './routes/pixelboard';
import { pixelAPI } from './routes/pixel';
import authRoutes from './routes/auth';
import { auth, optionalAuth } from './middleware/auth';

export const api = express.Router();

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

// Routes protégées (nécessitent une authentification)
api.use('/articles', auth, articleAPI);
api.use('/pixelboards', auth, pixelBoardAPI);
api.use('/pixels', auth, pixelAPI);

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