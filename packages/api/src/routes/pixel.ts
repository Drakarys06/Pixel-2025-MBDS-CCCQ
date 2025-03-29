// Modifier routes/pixel.ts pour gérer l'authentification et les contributeurs
import express, { Request, Response } from 'express';
import * as pixelService from '../services/pixel';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';
import PixelBoard from '../models/pixelboard';

const router = express.Router();

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

// Place a pixel (create or update) at specific coordinates on a board (requires authentication)
router.post('/board/:boardId/place', auth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;
		const { x, y, color } = req.body;
		const userId = req.user._id.toString();
		const username = req.user.username;

		if (x === undefined || y === undefined || !color) {
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

		// Placer le pixel
		const pixel = await pixelService.placePixel(boardId, parseInt(x as string), parseInt(y as string), color, userId);

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
		const existingContributor = pixelBoard.contributors.find(
			contributor => contributor.userId === userId
		);

		if (existingContributor) {
			// Incrémenter le compteur de pixels si l'utilisateur existe déjà
			existingContributor.pixelsCount += 1;
		} else {
			// Ajouter un nouveau contributeur s'il n'existe pas encore
			pixelBoard.contributors.push({
				userId,
				username,
				pixelsCount: 1
			});
		}

		// Sauvegarder les modifications du tableau
		await pixelBoard.save();

		// Incrémenter le compteur de pixels placés par l'utilisateur s'il n'est pas un invité
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

// Ajouter un endpoint pour récupérer les contributeurs d'un tableau
router.get('/board/:boardId/contributors', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;

		const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
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
