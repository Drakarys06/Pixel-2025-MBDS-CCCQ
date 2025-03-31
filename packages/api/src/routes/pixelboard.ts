import express, { Request, Response } from 'express';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';
import { hasPermission, isResourceCreator } from '../middleware/authorization';
import { PERMISSIONS } from '../services/roleService';
import Role from '../models/Role';
import { DEFAULT_ROLES } from '../services/roleService';

const router = express.Router();

// Get boards created by the authenticated user (requires authentication)
// Important: cette route doit être AVANT la route /:id pour éviter l'erreur
router.get('/my-boards', auth, async (req: Request, res: Response) => {
	try {
		const userId = req.user._id;
		const myBoards = await pixelBoardService.getPixelBoardsByCreator(userId);
		res.json(myBoards);
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Get boards where the authenticated user has contributed (placed at least one pixel)
router.get('/contributed-boards', auth, async (req: Request, res: Response) => {
	try {
		const userId = req.user._id;
		const contributedBoards = await pixelBoardService.getPixelBoardsWithUserContribution(userId);
		res.json(contributedBoards);
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Create a new pixel board (requires authentication and permission)
router.post('/',
	auth,
	hasPermission(PERMISSIONS.BOARD_CREATE),
	async (req: Request, res: Response) => {
		try {
			const pixelBoard = await pixelBoardService.createPixelBoard({
				...req.body,
				creator: req.user._id,
				creatorUsername: req.user.username
			});

			if (!req.isGuest && req.user.boardsCreated !== undefined) {
				req.user.boardsCreated += 1;
				await req.user.save();
			}

			res.status(201).json(pixelBoard);
		} catch (error) {
			if (error instanceof Error) {
				res.status(400).json({ message: error.message });
			} else {
				res.status(500).json({ message: 'An unknown error occurred' });
			}
		}
	});

// Get all pixel boards (optional authentication)
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

// Get a pixel board by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
	try {
		const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}

		if (!pixelBoard.visitor && !req.user) {
			return res.status(401).json({
				message: 'Authentication required to view this board',
				redirectTo: '/login'
			});
		}

		let readOnly = false;

		if (!req.user || req.isGuest) {
			if (!pixelBoard.visitor) {
				readOnly = true;
			}
		} else {
			readOnly = false;
		}

		res.json({
			...pixelBoard.toObject(),
			readOnly
		});
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Update a pixel board (requires authentication)
// MODIFICATION: Supprimé la vérification hasPermission pour permettre aux créateurs de modifier leurs propres tableaux
router.put('/:id',
	auth,
	isResourceCreator(
		async (req) => {
			return await pixelBoardService.getPixelBoardById(req.params.id);
		},
		PERMISSIONS.BOARD_UPDATE
	),
	async (req: Request, res: Response) => {
		try {
			const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
			if (!pixelBoard) {
				return res.status(404).json({ message: 'PixelBoard not found' });
			}

			const updatedData = {
				...req.body,
				creator: pixelBoard.creator,
				creatorUsername: pixelBoard.creatorUsername
			};

			const updatedBoard = await pixelBoardService.updatePixelBoard(req.params.id, updatedData);
			res.json(updatedBoard);
		} catch (error) {
			if (error instanceof Error) {
				res.status(400).json({ message: error.message });
			} else {
				res.status(500).json({ message: 'An unknown error occurred' });
			}
		}
	});

// Delete a pixel board (requires authentication and permission)
router.delete('/:id',
	auth,
	hasPermission(PERMISSIONS.BOARD_DELETE),
	isResourceCreator(
		async (req) => {
			return await pixelBoardService.getPixelBoardById(req.params.id);
		},
		PERMISSIONS.BOARD_DELETE
	),
	async (req: Request, res: Response) => {
		try {
			const pixelBoard = await pixelBoardService.getPixelBoardById(req.params.id);
			if (!pixelBoard) {
				return res.status(404).json({ message: 'PixelBoard not found' });
			}

			const deletedBoard = await pixelBoardService.deletePixelBoard(req.params.id);

			if (!req.isGuest && req.user.boardsCreated !== undefined) {
				req.user.boardsCreated -= 1;
				if (req.user.boardsCreated < 0) req.user.boardsCreated = 0;
				await req.user.save();
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
