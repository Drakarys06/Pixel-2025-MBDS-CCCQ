// Modifier les routes pixelboard.ts pour permettre l'accès en lecture seule pour certains tableaux
import express, { Request, Response } from 'express';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Create a new pixel board (requires authentication)
router.post('/', async (req: Request, res: Response) => {
  try {
    // Ajouter l'ID du créateur depuis l'utilisateur authentifié
    const pixelBoard = await pixelBoardService.createPixelBoard({
      ...req.body,
      creator: req.user._id
    });
    
    // Incrémenter le compteur de tableaux créés par l'utilisateur
    req.user.boardsCreated += 1;
    await req.user.save();
    
    res.status(201).json(pixelBoard);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Get all pixel boards (optional authentication for visitor mode)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const pixelBoards = await pixelBoardService.getAllPixelBoards();
    res.json(pixelBoards);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Get a pixel board by ID (optional authentication for visitor mode)
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
    }
    
    // Si le tableau n'autorise pas les visiteurs et que l'utilisateur n'est pas authentifié
    if (!pixelBoard.visitor && !req.user) {
      return res.status(401).json({ 
        message: 'Authentication required to view this board',
        redirectTo: '/login'
      });
    }
    
    res.json(pixelBoard);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Update a pixel board (requires authentication)
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    // Vérifier si l'utilisateur est le créateur du tableau
    const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
    }
    
    if (pixelBoard.creator !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Only the creator can update this board' });
    }
    
    const updatedBoard = await pixelBoardService.updatePixelBoard(req.params.id, req.body);
    res.json(updatedBoard);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Delete a pixel board (requires authentication)
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    // Vérifier si l'utilisateur est le créateur du tableau
    const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
    }
    
    if (pixelBoard.creator !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Only the creator can delete this board' });
    }
    
    const deletedBoard = await pixelBoardService.deletePixelBoard(req.params.id);
    
    // Décrémenter le compteur de tableaux créés par l'utilisateur
    req.user.boardsCreated -= 1;
    if (req.user.boardsCreated < 0) req.user.boardsCreated = 0;
    await req.user.save();
    
    res.json({ message: 'PixelBoard deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

export const pixelBoardAPI = router;