// packages/api/src/routes/pixel.ts - Version complète
import express, { Request, Response } from 'express';
import * as pixelService from '../services/pixel';
import * as pixelBoardService from '../services/pixelboard';
import * as pixelHistoryService from '../services/pixelHistory'; // Nouveau import
import { auth, optionalAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/authorization';
import { PERMISSIONS } from '../services/roleService';
import PixelBoard from '../models/pixelboard';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pixels
 *   description: Pixel management
 */


/**
 * @swagger
 * /api/pixels:
 *   get:
 *     summary: Get all pixels
 *     tags: [Pixels]
 *     parameters:
 *       - in: query
 *         name: boardId
 *         schema:
 *           type: string
 *         description: Filter by board ID
 *     responses:
 *       200:
 *         description: List of pixels
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
	try {
		const boardId = req.query.boardId as string;

		if (boardId) {
			const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
			if (!pixelBoard) {
				return res.status(404).json({ message: 'PixelBoard not found' });
			}

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

/**
 * @swagger
 * /api/pixels/{id}:
 *   get:
 *     summary: Get a pixel by ID
 *     tags: [Pixels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The pixel
 *       404:
 *         description: Pixel not found
 *   delete:
 *     summary: Delete a pixel
 *     tags: [Pixels]
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
 *         description: Pixel deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Pixel not found
 */
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

/**
 * @swagger
 * /api/pixels/board/{boardId}/place:
 *   post:
 *     summary: Place a pixel on a board
 *     tags: [Pixels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
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
 *               x:
 *                 type: number
 *               y:
 *                 type: number
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pixel placed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Board is closed or user doesn't have permission
 *       429:
 *         description: Too many requests (cooldown period)
 */
router.post('/board/:boardId/place',
	auth,
	async (req: Request, res: Response) => {
		try {
			const { boardId } = req.params;
			const { x, y, color } = req.body;
			const userId = req.user._id.toString();
			const username = req.user.username || 'Unknown User';

			if (x === undefined || y === undefined || !color) {
				return res.status(400).json({ message: 'Position (x, y) and color are required' });
			}

			const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
			if (!pixelBoard) {
				return res.status(404).json({ message: 'PixelBoard not found' });
			}

			if (pixelBoard.closeTime && new Date() > new Date(pixelBoard.closeTime)) {
				return res.status(403).json({ message: 'This board is closed and no longer accepts modifications' });
			}

			if (req.isGuest) {
				if (!pixelBoard.visitor) {
					return res.status(403).json({ message: 'Guests are not allowed to place pixels on this board' });
				}
			} else {
				const hasPermission = await req.user.hasPermission(PERMISSIONS.PIXEL_CREATE);
				if (!hasPermission) {
					return res.status(403).json({
						success: false,
						message: 'Forbidden: Insufficient permissions to place pixels'
					});
				}
			}

			if (x < 0 || x >= pixelBoard.width || y < 0 || y >= pixelBoard.length) {
				return res.status(400).json({ message: 'Position is outside the board boundaries' });
			}

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

			const pixel = await pixelService.placePixel(
				boardId,
				parseInt(x as unknown as string),
				parseInt(y as unknown as string),
				color,
				userId,
				username
			);

			// Émettre l'événement via WebSockets
			try {
				const { io } = require('../index');

				io.to(`board-${boardId}`).emit('pixelPlaced', {
					...pixel.toObject(),
					username: req.user.username
				});
				console.log(`Emitted pixelPlaced event for board ${boardId} from user ${req.user.username}`);
			} catch (error) {
				console.error('Failed to emit pixelPlaced event:', error);
			}

			const existingContributor = pixelBoard.contributors?.find(
				contributor => contributor.userId === userId
			);

			if (existingContributor) {
				existingContributor.pixelsCount += 1;
				existingContributor.lastPixelTime = new Date();
			} else {
				if (!pixelBoard.contributors) {
					pixelBoard.contributors = [];
				}

				pixelBoard.contributors.push({
					userId,
					username,
					pixelsCount: 1,
					lastPixelTime: new Date()
				});
			}

			await pixelBoard.save();

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

			const pixelBoard = await pixelBoardService.getPixelBoardById(pixel.boardId.toString());
			if (!pixelBoard) {
				return res.status(404).json({ message: 'PixelBoard not found' });
			}

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

/**
 * @swagger
 * /api/pixels/board/{boardId}/history:
 *   get:
 *     summary: Get pixel history for a board
 *     tags: [Pixels]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pixel history for the board
 *       404:
 *         description: Board not found
 */
router.get('/board/:boardId/history', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;
		const { limit, skip } = req.query;

		const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}

		if (!pixelBoard.visitor && !req.user) {
			return res.status(401).json({
				message: 'Authentication required to view history on this board',
				redirectTo: '/login'
			});
		}

		const limitNum = limit ? parseInt(limit as string, 10) : undefined;
		const skipNum = skip ? parseInt(skip as string, 10) : undefined;

		const pixelHistory = await pixelHistoryService.getPixelHistoryForBoard(
			boardId,
			limitNum,
			skipNum
		);

		let totalEntries;
		if (limitNum !== undefined) {
			totalEntries = await pixelHistoryService.getPixelHistoryCount(boardId);
		}

		const response: any = { history: pixelHistory };
		if (totalEntries !== undefined) {
			response.totalEntries = totalEntries;
		}

		res.json(response);
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
 * /api/pixels/board/{boardId}/snapshot:
 *   get:
 *     summary: Get board snapshot at a specific time
 *     tags: [Pixels]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timestamp
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Board state at the requested time
 *       400:
 *         description: Invalid timestamp
 *       404:
 *         description: Board not found
 */
router.get('/board/:boardId/snapshot', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;
		const { timestamp } = req.query;

		if (!timestamp) {
			return res.status(400).json({ message: 'Timestamp is required' });
		}

		const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}

		if (!pixelBoard.visitor && !req.user) {
			return res.status(401).json({
				message: 'Authentication required to view snapshots on this board',
				redirectTo: '/login'
			});
		}

		const timestampDate = new Date(timestamp as string);
		if (isNaN(timestampDate.getTime())) {
			return res.status(400).json({ message: 'Invalid timestamp format' });
		}

		const boardState = await pixelHistoryService.getBoardStateAtTime(boardId, timestampDate);

		res.json(boardState);
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: 'An unknown error occurred' });
		}
	}
});

// Récupérer des points temporels clés pour le timelapse
router.get('/board/:boardId/timelapse-points', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;
		const { count } = req.query;

		const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}

		if (!pixelBoard.visitor && !req.user) {
			return res.status(401).json({
				message: 'Authentication required to view timelapse on this board',
				redirectTo: '/login'
			});
		}

		const snapshotCount = count ? parseInt(count as string, 10) : 10;
		if (isNaN(snapshotCount) || snapshotCount <= 0) {
			return res.status(400).json({ message: 'Invalid count parameter' });
		}

		const snapshots = await pixelHistoryService.getBoardSnapshots(boardId, snapshotCount);

		res.json(snapshots);
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
 * /api/pixels/board/{boardId}/contributors:
 *   get:
 *     summary: Get board contributors
 *     tags: [Pixels]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of board contributors
 *       404:
 *         description: Board not found
 */
router.get('/board/:boardId/contributors', optionalAuth, async (req: Request, res: Response) => {
	try {
		const { boardId } = req.params;

		const pixelBoard = await pixelBoardService.getPixelBoardById(boardId);
		if (!pixelBoard) {
			return res.status(404).json({ message: 'PixelBoard not found' });
		}

		if (!pixelBoard.contributors) {
			return res.json([]);
		}

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
