// middleware/auth.ts
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
    // Récupérer le token depuis l'en-tête Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        redirectTo: '/login'
      });
      return;
    }
    
    // Vérifier si c'est un token visiteur (commence par "guest-")
    if (token.startsWith('guest-')) {
      req.user = {
        _id: token,
        username: 'Guest',
        roles: ['guest']
      };
      req.isGuest = true;
      req.token = token;
      return next();
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Trouver l'utilisateur correspondant
    const user = await User.findById(decoded.id).select('-password').populate('roles');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Ajouter l'utilisateur et le token à la requête
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
    
    // Si aucun token n'est fourni, continuer sans définir l'utilisateur
    if (!token) {
      return next();
    }
    
    // Vérifier si c'est un token visiteur
    if (token.startsWith('guest-')) {
      req.user = {
        _id: token,
        username: 'Guest',
        roles: ['guest']
      };
      req.isGuest = true;
      req.token = token;
      return next();
    }
    
    // Vérifier le token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      
      // Trouver l'utilisateur correspondant
      const user = await User.findById(decoded.id).select('-password').populate('roles');
      
      if (user) {
        req.user = user;
        req.token = token;
        req.isGuest = false;
      }
    } catch (err) {
      // Token invalide, mais nous continuons quand même
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans définir l'utilisateur
    next();
  }
};