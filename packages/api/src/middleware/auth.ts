import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// JWT Secret (devrait être dans les variables d'environnement en production)
const JWT_SECRET = 'pixelboard-secret-key-change-in-production';

// Extension du type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// Middleware d'authentification
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Aucun token fourni'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Trouver l'utilisateur correspondant
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Ajouter l'utilisateur et le token à la requête
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({
      success: false,
      message: 'Accès refusé. Token invalide'
    });
  }
};

// Middleware d'authentification optionnel (pour les routes accessibles aux visiteurs)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Si aucun token n'est fourni, continuer sans définir l'utilisateur
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Trouver l'utilisateur correspondant
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans définir l'utilisateur
    next();
  }
};