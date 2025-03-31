import express from 'express';
import { Request, Response } from 'express';
import User from '../models/User';
import PixelBoard from '../models/pixelboard';

const router = express.Router();

// Get homepage statistics
router.get('/home', async (_req: Request, res: Response) => {
	try {
		const userCount = await User.countDocuments();

		const boardCount = await PixelBoard.countDocuments();

		const now = new Date();

		const activeBoards = await PixelBoard.aggregate([
			{
				$match: {
					closeTime: null,
					$expr: {
						$gt: [
							{ $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] },
							now
						]
					}
				}
			},
			{
				$addFields: {
					endTime: { $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] },
					timeRemaining: {
						$subtract: [
							{ $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] },
							now
						]
					}
				}
			},
			{
				$sort: { timeRemaining: 1 }
			},
			{
				$limit: 4
			}
		]);

		const completedBoardsWithCloseTime = await PixelBoard.find({
			closeTime: { $ne: null }
		})
			.sort({ closeTime: -1 })
			.limit(4);

		// Get boards that have expired naturally without being explicitly closed
		// Using aggregation to sort them by most recently expired
		const expiredBoards = await PixelBoard.aggregate([
			{
				$match: {
					closeTime: null,
					$expr: {
						$lte: [
							{ $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] },
							now
						]
					}
				}
			},
			{
				$addFields: {
					expiryTime: { $add: [{ $toDate: "$creationTime" }, { $multiply: ["$time", 60000] }] }
				}
			},
			{
				$sort: { expiryTime: -1 }
			},
			{
				$limit: 4
			}
		]);

		let completedBoardsWithConvertedDates = [];

		const formattedClosedBoards = completedBoardsWithCloseTime.map(board => {
			const boardObj = board.toObject ? board.toObject() : board;
			return {
				...boardObj,
				expiryDate: boardObj.closeTime
			};
		});

		completedBoardsWithConvertedDates = [
			...formattedClosedBoards,
			...expiredBoards
		];

		const completedBoards = completedBoardsWithConvertedDates
			.sort((a, b) => {
				const aDate = new Date(a.expiryTime || a.expiryDate);
				const bDate = new Date(b.expiryTime || b.expiryDate);
				return bDate.getTime() - aDate.getTime();
			})
			.slice(0, 4);

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
