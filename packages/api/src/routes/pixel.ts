import express, { Request, Response } from 'express';
import * as pixelService from '../services/pixel';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/authorization';
import { PERMISSIONS } from '../services/roleService';
import PixelBoard from '../models/pixelboard';

const router = express.Router();

// Get all pixels (optional authentication)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const boardId = req.query.boardId as string;
    
    // Si on filtre par boardId, vérifier si le tableau autorise les visiteurs
    if (boardId) {
      const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
      if (!pixelBoard) {
        return res.status(404).json({ message: 'PixelBoard not found' });
      }

      // Si le tableau n'autorise pas les visiteurs et que l'utilisateur n'est pas authentifié
      if (!pixelBoard.visitor && !req.user) {
        return res.status(401).json({
          message: 'Authentication required to view pixels on this board',
          redirectTo: '/login'
        });
      }
    }
    
    // Tous les utilisateurs peuvent voir les pixels, même en mode lecture seule
    const pixels = await pixelService.getAllPixels(boardId);
    res.json(pixels);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Get a pixel by ID (optional authentication)
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const pixel = await pixelService.getPixelById(req.params.id);
    if (!pixel) {
      return res.status(404).json({ message: 'Pixel not found' });
    }
    
    res.json(pixel);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Place a pixel (create or update) at specific coordinates on a board (requires authentication)
router.post('/board/:boardId/place', 
  auth, 
  // Nous avons supprimé la vérification de permission ici pour la gérer à l'intérieur de la route
  // hasPermission(PERMISSIONS.PIXEL_CREATE),
  async (req: Request, res: Response) => {
    try {
      const { boardId } = req.params;
      const { x, y, color } = req.body;
      const userId = req.user._id.toString();
      const username = req.user.username;

      if (x === undefined || y === undefined || !color) {
        return res.status(400).json({ message: 'Position (x, y) and color are required' });
      }

      // Vérifier si le tableau existe
      const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
      if (!pixelBoard) {
        return res.status(404).json({ message: 'PixelBoard not found' });
      }
      
      // Vérifier si le tableau est fermé
      if (pixelBoard.closeTime && new Date() > new Date(pixelBoard.closeTime)) {
        return res.status(403).json({ message: 'This board is closed and no longer accepts modifications' });
      }
      
      // D'abord vérifier si c'est un invité et si le tableau autorise les invités
      if (req.isGuest) {
        if (!pixelBoard.visitor) {
          return res.status(403).json({ message: 'Guests are not allowed to place pixels on this board' });
        }
      } else {
        // Pour les utilisateurs non invités, vérifier la permission normalement
        const hasPermission = await req.user.hasPermission(PERMISSIONS.PIXEL_CREATE);
        if (!hasPermission) {
          return res.status(403).json({ 
            success: false, 
            message: 'Forbidden: Insufficient permissions to place pixels' 
          });
        }
      }

      // Vérifier si la position est valide
      if (x < 0 || x >= pixelBoard.width || y < 0 || y >= pixelBoard.length) {
        return res.status(400).json({ message: 'Position is outside the board boundaries' });
      }
      
      // Check for cooldown if it exists
      if (pixelBoard.cooldown > 0) {
        const contributor = pixelBoard.contributors.find(c => c.userId === userId);
        if (contributor && contributor.lastPixelTime) {
          const lastPlacedAt = new Date(contributor.lastPixelTime);
          const now = new Date();
          const diffSeconds = (now.getTime() - lastPlacedAt.getTime()) / 1000;

          if (diffSeconds < pixelBoard.cooldown) {
            const remainingSeconds = Math.ceil(pixelBoard.cooldown - diffSeconds);
            return res.status(429).json({
              message: `Please wait ${remainingSeconds} seconds before placing another pixel`,
              remainingSeconds: remainingSeconds
            });
          }
        }
      }

      // Placer le pixel
      const pixel = await pixelService.placePixel(
        boardId, 
        parseInt(x as unknown as string), 
        parseInt(y as unknown as string), 
        color, 
        userId
      );

      // Émettre l'événement via WebSockets (fonctionnalité de main)
      try {
        const { io } = require('../index');

        // Pixel placed event
        io.to(`board-${boardId}`).emit('pixelPlaced', {
          ...pixel.toObject(),
          username: req.user.username
        });
        console.log(`Emitted pixelPlaced event for board ${boardId} from user ${req.user.username}`);
      } catch (error) {
        console.error('Failed to emit pixelPlaced event:', error);
      }

      // Ajouter ou mettre à jour l'utilisateur dans la liste des contributeurs
      const existingContributor = pixelBoard.contributors?.find(
        contributor => contributor.userId === userId
      );

      if (existingContributor) {
        // Incrémenter le compteur de pixels si l'utilisateur existe déjà
        existingContributor.pixelsCount += 1;
        existingContributor.lastPixelTime = new Date();
      } else {
        // Si la propriété contributors n'existe pas encore, l'initialiser
        if (!pixelBoard.contributors) {
          pixelBoard.contributors = [];
        }
        
        // Ajouter un nouveau contributeur s'il n'existe pas encore
        pixelBoard.contributors.push({
          userId,
          username,
          pixelsCount: 1,
          lastPixelTime: new Date()
        });
      }

      // Sauvegarder les modifications du tableau
      await pixelBoard.save();
      
      // Incrémenter le compteur de pixels placés pour les utilisateurs authentifiés (non-invités)
      if (!req.isGuest && req.user.pixelsPlaced !== undefined) {
        req.user.pixelsPlaced += 1;
        await req.user.save();
      }
      
      res.status(201).json(pixel);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
});

// Delete a pixel (requires authentication and permission)
router.delete('/:id', 
  auth, 
  hasPermission(PERMISSIONS.PIXEL_DELETE),
  async (req: Request, res: Response) => {
    try {
      const pixel = await pixelService.getPixelById(req.params.id);
      if (!pixel) {
        return res.status(404).json({ message: 'Pixel not found' });
      }
      
      // Vérifier si l'utilisateur a les droits de modification
      const pixelBoard = await pixelBoardService.getPixelBoardById(pixel.boardId.toString());
      if (!pixelBoard) {
        return res.status(404).json({ message: 'PixelBoard not found' });
      }
      
      // Seul le créateur du tableau ou les modificateurs du pixel peuvent le supprimer
      const isCreator = pixelBoard.creator.toString() === req.user._id.toString();
      const isModifier = pixel.modifiedBy.includes(req.user._id.toString());
      const hasDeletePermission = await req.user.hasPermission(PERMISSIONS.PIXEL_DELETE);
      
      if (!isCreator && !isModifier && !hasDeletePermission) {
        return res.status(403).json({ message: 'You do not have permission to delete this pixel' });
      }
      
      const deletedPixel = await pixelService.deletePixel(req.params.id);
      res.json({ message: 'Pixel deleted successfully', pixel: deletedPixel });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
});

// Ajouter un endpoint pour récupérer les contributeurs d'un tableau
router.get('/board/:boardId/contributors', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;

    const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
    }

    // Gérer le cas où contributors n'existe pas encore
    if (!pixelBoard.contributors) {
      return res.json([]);
    }

    // Trier les contributeurs par nombre de pixels placés (décroissant)
    const sortedContributors = pixelBoard.contributors.sort((a, b) => b.pixelsCount - a.pixelsCount);

    res.json(sortedContributors);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

export const pixelAPI = router;