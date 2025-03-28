import express, { Request, Response } from 'express';
import * as pixelService from '../services/pixel';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/authorization';
import { PERMISSIONS } from '../services/roleService';

const router = express.Router();

// Get all pixels (optional authentication)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const boardId = req.query.boardId as string;
    
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
  hasPermission(PERMISSIONS.PIXEL_CREATE),
  async (req: Request, res: Response) => {
    try {
      const { boardId } = req.params;
      const { x, y, color } = req.body;
      const userId = req.user._id.toString();

      // Vérifier si le tableau existe
      const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
      if (!pixelBoard) {
        return res.status(404).json({ message: 'PixelBoard not found' });
      }
      
      // Vérifier si le tableau est fermé
      if (pixelBoard.closeTime && new Date() > new Date(pixelBoard.closeTime)) {
        return res.status(403).json({ message: 'This board is closed and no longer accepts modifications' });
      }
      
      // Vérifier si les visiteurs sont autorisés pour ce tableau
      if (req.isGuest && !pixelBoard.visitor) {
        return res.status(403).json({ message: 'Guests are not allowed to place pixels on this board' });
      }

      // Vérifier si la position est valide
      if (x < 0 || x >= pixelBoard.width || y < 0 || y >= pixelBoard.length) {
        return res.status(400).json({ message: 'Position is outside the board boundaries' });
      }

      // Placer le pixel
      const pixel = await pixelService.placePixel(
        boardId, 
        parseInt(x as unknown as string), 
        parseInt(y as unknown as string), 
        color, 
        userId
      );
      
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

export const pixelAPI = router;