import express from 'express';
import { Request, Response } from 'express';
import User from '../models/User';
import PixelBoard from '../models/pixelboard';

const router = express.Router();

// Get homepage statistics
router.get('/home', async (_req: Request, res: Response) => {
	try {
		// Get user count
		const userCount = await User.countDocuments();

		// Get board count
		const boardCount = await PixelBoard.countDocuments();

		// Get recent active boards (not closed, sorted by creation date)
		const now = new Date();
		const activeBoards = await PixelBoard.find({
			closeTime: null,
			$expr: {
				$gt: [
					{ $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] },
					now
				]
			}
		})
			.sort({ creationTime: -1 })
			.limit(3);

		// Get recent completed boards (closed or expired, sorted by closing date)
		const completedBoardsWithCloseTime = await PixelBoard.find({
			closeTime: { $ne: null }
		})
			.sort({ closeTime: -1 })
			.limit(3);

		// Also get boards that have expired naturally without being explicitly closed
		const expiredBoards = await PixelBoard.find({
			closeTime: null,
			$expr: {
				$lte: [
					{ $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] },
					now
				]
			}
		})
			.sort({ creationTime: -1 })
			.limit(3);

		// Combine, sort and limit to 3 boards
		const allCompletedBoards = [...completedBoardsWithCloseTime, ...expiredBoards];
		const completedBoards = allCompletedBoards
			.sort((a, b) => {
				const aDate = a.closeTime ? new Date(a.closeTime) : new Date(new Date(a.creationTime).getTime() + a.time * 60000);
				const bDate = b.closeTime ? new Date(b.closeTime) : new Date(new Date(b.creationTime).getTime() + b.time * 60000);
				return bDate.getTime() - aDate.getTime();
			})
			.slice(0, 3);

		res.json({
			userCount,
			boardCount,
			activeBoards,
			completedBoards
		});
	} catch (error) {
		console.error('Error fetching home stats:', error);
		res.status(500).json({ message: 'An error occurred while fetching statistics' });
	}
});

export default router;
