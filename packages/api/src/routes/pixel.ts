// Modifier routes/pixel.ts pour gérer l'authentification
import express, { Request, Response } from 'express';
import * as pixelService from '../services/pixel';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Create a new pixel (requires authentication)
router.post('/', auth, async (req: Request, res: Response) => {
	try {
		// Utiliser l'ID de l'utilisateur connecté
		const pixel = await pixelService.createPixel({
			...req.body,
			modifiedBy: [req.user._id.toString()]
		});
		
		// Incrémenter le compteur de pixels placés par l'utilisateur
		req.user.pixelsPlaced += 1;
		await req.user.save();
		
		res.status(201).json(pixel);
	} catch (error) {
		if (error instanceof Error) {
			res.status(400).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Get all pixels (optional authentication for visitor mode)
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

// Get a pixel by ID (optional authentication for visitor mode)
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
	try {
		const pixel = await pixelService.getPixelById(req.params.id);
		if (!pixel) {
			return res.status(404).json({ message: 'Pixel not found' });
		}
		
		// Vérifier si le tableau auquel appartient le pixel autorise les visiteurs
		const pixelBoard = await pixelBoardService.getPixelBoardById(pixel.boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}
		
		// Si le tableau n'autorise pas les visiteurs et que l'utilisateur n'est pas authentifié
		if (!pixelBoard.visitor && !req.user) {
			return res.status(401).json({ 
				message: 'Authentication required to view this pixel',
				redirectTo: '/login'
			});
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

// Get a pixel by coordinates and board ID (optional authentication for visitor mode)
router.get('/board/:boardId/position/:x/:y', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { boardId, x, y } = req.params;
		
		// Vérifier si le tableau autorise les visiteurs
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

// Update a pixel (requires authentication)
router.put('/:id', auth, async (req: Request, res: Response) => {
	try {
		// Utiliser l'ID de l'utilisateur connecté
		const pixel = await pixelService.updatePixel(req.params.id, req.body, req.user._id.toString());
		if (!pixel) {
			return res.status(404).json({ message: 'Pixel not found' });
		}
		
		// Incrémenter le compteur de pixels placés par l'utilisateur
		req.user.pixelsPlaced += 1;
		await req.user.save();
		
		res.json(pixel);
	} catch (error) {
		if (error instanceof Error) {
			res.status(400).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Place a pixel (create or update) at specific coordinates on a board (requires authentication)
router.post('/board/:boardId/place', auth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;
		const { x, y, color } = req.body;
		const userId = req.user._id.toString();

		if (!x || !y || !color) {
			return res.status(400).json({ message: 'Position (x, y) and color are required' });
		}

		// Vérifier si le tableau existe et s'il est encore ouvert
		const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}
		
		// Vérifier si le tableau est fermé (si closeTime est défini et passé)
		if (pixelBoard.closeTime && new Date() > new Date(pixelBoard.closeTime)) {
			return res.status(403).json({ message: 'This board is closed and no longer accepts modifications' });
		}
		
		// Vérifier si la position est valide (dans les limites du tableau)
		if (x < 0 || x >= pixelBoard.width || y < 0 || y >= pixelBoard.length) {
			return res.status(400).json({ message: 'Position is outside the board boundaries' });
		}

		const pixel = await pixelService.placePixel(boardId, parseInt(x as string), parseInt(y as string), color, userId);
		
		// Incrémenter le compteur de pixels placés par l'utilisateur
		req.user.pixelsPlaced += 1;
		await req.user.save();
		
		res.status(201).json(pixel);
	} catch (error) {
		if (error instanceof Error) {
			res.status(400).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Delete a pixel (requires authentication)
router.delete('/:id', auth, async (req: Request, res: Response) => {
	try {
		// On pourrait ajouter ici une vérification pour permettre seulement 
		// au créateur du pixel ou du tableau de supprimer un pixel
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