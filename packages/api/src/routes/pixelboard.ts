import express, { Request, Response } from 'express';
import * as pixelBoardService from '../services/pixelboard';
import { auth, optionalAuth } from '../middleware/auth';
import { hasPermission, isResourceCreator } from '../middleware/authorization';
import { PERMISSIONS } from '../services/roleService';
import Role from '../models/Role';
import { DEFAULT_ROLES } from '../services/roleService';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PixelBoards
 *   description: PixelBoard management
 */

/**
 * @swagger
 * /api/pixelboards/my-boards:
 *   get:
 *     summary: Get boards created by the logged in user
 *     tags: [PixelBoards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's boards
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/pixelboards/contributed-boards:
 *   get:
 *     summary: Get boards where the user has contributed
 *     tags: [PixelBoards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of boards the user has contributed to
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/pixelboards/{id}:
 *   get:
 *     summary: Get a pixel board by ID
 *     tags: [PixelBoards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The pixel board
 *       404:
 *         description: Board not found
 *   put:
 *     summary: Update a pixel board
 *     tags: [PixelBoards]
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
 *     responses:
 *       200:
 *         description: Board updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Board not found
 *   delete:
 *     summary: Delete a pixel board
 *     tags: [PixelBoards]
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
 *         description: Board deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Board not found
 */
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
