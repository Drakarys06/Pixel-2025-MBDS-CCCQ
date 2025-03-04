import express, { Request, Response } from 'express';
import * as pixelBoardService from '../services/pixelboard';

const router = express.Router();

// Create a new pixel board
router.post('/', async (req: Request, res: Response) => {
  try {
    const pixelBoard = await pixelBoardService.createPixelBoard(req.body);
    res.status(201).json(pixelBoard);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Get all pixel boards
router.get('/', async (_req: Request, res: Response) => {
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

// Get a pixel board by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
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

// Update a pixel board
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const pixelBoard = await pixelBoardService.updatePixelBoard(req.params.id, req.body);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
    }
    res.json(pixelBoard);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Delete a pixel board
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const pixelBoard = await pixelBoardService.deletePixelBoard(req.params.id);
    if (!pixelBoard) {
      return res.status(404).json({ message: 'PixelBoard not found' });
    }
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