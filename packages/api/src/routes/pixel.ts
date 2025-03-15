import express, { Request, Response } from 'express';
import * as pixelService from '../services/pixel';

const router = express.Router();

// Create a new pixel
router.post('/', async (req: Request, res: Response) => {
	try {
		const pixel = await pixelService.createPixel(req.body);
		res.status(201).json(pixel);
	} catch (error) {
		if (error instanceof Error) {
			res.status(400).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Get all pixels (optionally filter by boardId)
router.get('/', async (req: Request, res: Response) => {
	try {
		const boardId = req.query.boardId as string;
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

// Get a pixel by ID
router.get('/:id', async (req: Request, res: Response) => {
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

// Get a pixel by coordinates and board ID
router.get('/board/:boardId/position/:x/:y', async (req: Request, res: Response) => {
	try {
		const { boardId, x, y } = req.params;
		const pixel = await pixelService.getPixelByPosition(boardId, parseInt(x), parseInt(y));
		if (!pixel) {
			return res.status(404).json({ message: 'Pixel not found at this position' });
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

// Update a pixel
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const userId = req.body.userId; // Assuming user ID is passed in the request body
		if (!userId) {
			return res.status(400).json({ message: 'User ID is required' });
		}

		const pixel = await pixelService.updatePixel(req.params.id, req.body, userId);
		if (!pixel) {
			return res.status(404).json({ message: 'Pixel not found' });
		}
		res.json(pixel);
	} catch (error) {
		if (error instanceof Error) {
			res.status(400).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Place a pixel (create or update) at specific coordinates on a board
router.post('/board/:boardId/place', async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;
		const { x, y, color, userId } = req.body;

		if (x === undefined || y === undefined || !color || !userId) {
			return res.status(400).json({ message: 'Position (x, y), color, and userId are required' });
		}

		const pixel = await pixelService.placePixel(boardId, parseInt(x), parseInt(y), color, userId);
		res.status(201).json(pixel);
	} catch (error) {
		if (error instanceof Error) {
			res.status(400).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Delete a pixel
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const pixel = await pixelService.deletePixel(req.params.id);
		if (!pixel) {
			return res.status(404).json({ message: 'Pixel not found' });
		}
		res.json({ message: 'Pixel deleted successfully' });
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

export const pixelAPI = router;
