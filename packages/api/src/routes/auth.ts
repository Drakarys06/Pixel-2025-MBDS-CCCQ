import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// JWT Secret (devrait être dans les variables d'environnement en production)
const JWT_SECRET = 'pixelboard-secret-key-change-in-production';

// Route d'inscription
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'email ou le nom d'utilisateur existent déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email ou nom d utilisateur déjà utilisé'
      });
    }

    // Créer un nouvel utilisateur
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// Route de connexion
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });
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

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

// Route pour vérifier si un token est valide
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Aucun token fourni'
      });
    }
    
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
    
    res.status(200).json({
      success: true,
      message: 'Token valide',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        pixelsPlaced: user.pixelsPlaced,
        boardsCreated: user.boardsCreated
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

export default router;