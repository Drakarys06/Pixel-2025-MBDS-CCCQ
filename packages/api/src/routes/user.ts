// routes/user.ts (version complète)
import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import User from '../models/User';
import PixelBoard from '../models/pixelboard';
import Pixel from '../models/pixel';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Current password is incorrect
 *       403:
 *         description: Guest users cannot change passwords
 */
router.put('/password', auth, async (req: Request, res: Response) => {
    try {
      // Si l'utilisateur est un invité, il ne peut pas changer de mot de passe
      if (req.isGuest) {
        return res.status(403).json({
          success: false,
          message: 'Guest users cannot change passwords',
          redirectTo: '/login'
        });
      }
  
      const { currentPassword, newPassword } = req.body;
      
      // Vérifier que les champs nécessaires sont présents
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }
      
      // Vérifier que le nouveau mot de passe respecte les règles de sécurité
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }
      
      // Rechercher l'utilisateur complet (y compris le mot de passe)
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Vérifier le mot de passe actuel en utilisant la méthode comparePassword
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Mettre à jour le mot de passe - le middleware pre-save s'occupera du hachage
      user.password = newPassword;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating password'
      });
    }
  });

/**
 * @swagger
 * /api/users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only view own stats
 *       404:
 *         description: User not found
 */
router.get('/:id/stats', auth, async (req: Request, res: Response) => {
  try {
    // Vérifier si l'utilisateur demande ses propres stats
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own stats'
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Récupérer les tableaux auxquels l'utilisateur a contribué
    const contributedBoards = await PixelBoard.find({
      "contributors.userId": req.params.id
    });
    
    // Trouver le tableau avec le plus de pixels placés par cet utilisateur
    let mostActiveBoard = null;
    let maxPixels = 0;
    
    for (const board of contributedBoards) {
      const contributor = board.contributors.find(c => c.userId === req.params.id);
      if (contributor && contributor.pixelsCount > maxPixels) {
        maxPixels = contributor.pixelsCount;
        mostActiveBoard = {
          id: board._id,
          title: board.title,
          pixelsPlaced: contributor.pixelsCount
        };
      }
    }
    
    res.json({
      pixelsPlaced: user.pixelsPlaced || 0,
      boardsCreated: user.boardsCreated || 0,
      boardsContributed: contributedBoards.length,
      mostActiveBoard: mostActiveBoard,
      joinDate: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/activity:
 *   get:
 *     summary: Get user recent activity
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User recent activity
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only view own activity
 *       404:
 *         description: User not found
 */
router.get('/:id/activity', auth, async (req: Request, res: Response) => {
  try {
    // Vérifier si l'utilisateur demande sa propre activité
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own activity'
      });
    }
    
    // Récupérer les pixels récents placés par l'utilisateur
    const recentPixels = await Pixel.find({
      modifiedBy: req.params.id
    })
    .sort({ lastModifiedDate: -1 })
    .limit(10);
    
    // Obtenir les détails des tableaux pour ces pixels
    const pixelsWithBoardInfo = await Promise.all(
      recentPixels.map(async (pixel) => {
        const board = await PixelBoard.findById(pixel.boardId);
        return {
          id: pixel._id,
          boardId: pixel.boardId,
          boardTitle: board ? board.title : 'Unknown Board',
          x: pixel.x,
          y: pixel.y,
          color: pixel.color,
          date: pixel.lastModifiedDate
        };
      })
    );
    
    res.json({
      recentPixels: pixelsWithBoardInfo
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input or username/email already taken
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own profile
 *       404:
 *         description: User not found
 */
router.put('/:id/profile', auth, async (req: Request, res: Response) => {
    try {
      // Vérifier si l'utilisateur met à jour son propre profil
      if (req.params.id !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile'
        });
      }
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const { username, email } = req.body;
      
      // Vérifier que les champs nécessaires sont présents
      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username and email are required'
        });
      }
      
      // Vérifier si le nom d'utilisateur ou l'email existe déjà (pour un autre utilisateur)
      if (username !== user.username || email !== user.email) {
        const existingUser = await User.findOne({
          $and: [
            { _id: { $ne: req.params.id } },
            { $or: [{ username }, { email }] }
          ]
        });
        
        if (existingUser) {
          if (existingUser.username === username) {
            return res.status(400).json({
              success: false,
              message: 'Username is already taken'
            });
          }
          if (existingUser.email === email) {
            return res.status(400).json({
              success: false,
              message: 'Email is already in use'
            });
          }
        }
      }
      
      // Mettre à jour les informations
      user.username = username;
      user.email = email;
      await user.save();
      
      // Mettre à jour le nom d'utilisateur dans localStorage côté client
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  });

export default router;