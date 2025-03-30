// packages/api/src/routes/stats.ts
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

		// Get current time for comparison
		const now = new Date();

		// Pour obtenir les tableaux avec le moins de temps restant, nous devons utiliser l'agrégation
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
				$sort: { timeRemaining: 1 } // Tri par temps restant (du plus court au plus long)
			},
			{
				$limit: 4
			}
		]);

		// Get recently closed boards (with explicit closeTime, newest closures first)
		const completedBoardsWithCloseTime = await PixelBoard.find({
			closeTime: { $ne: null }
		})
			.sort({ closeTime: -1 }) // Tri par date de fermeture (les plus récents d'abord)
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
				$sort: { expiryTime: -1 } // Tri par date d'expiration (les plus récents d'abord)
			},
			{
				$limit: 4
			}
		]);

		// Combine both types of completed boards
		let completedBoardsWithConvertedDates = [];

		// Convertir les tableaux avec closeTime explicite en format standard
		const formattedClosedBoards = completedBoardsWithCloseTime.map(board => {
			// Convertir le document Mongoose en objet standard
			const boardObj = board.toObject ? board.toObject() : board;
			return {
				...boardObj,
				// Utiliser closeTime comme date d'expiration
				expiryDate: boardObj.closeTime
			};
		});

		// Combiner les deux types de tableaux
		completedBoardsWithConvertedDates = [
			...formattedClosedBoards,
			...expiredBoards
		];

		// Trier tous les tableaux par date d'expiration décroissante (les plus récents d'abord)
		const completedBoards = completedBoardsWithConvertedDates
			.sort((a, b) => {
				const aDate = new Date(a.expiryTime || a.expiryDate);
				const bDate = new Date(b.expiryTime || b.expiryDate);
				return bDate.getTime() - aDate.getTime();
			})
			.slice(0, 4); // Limiter à 4 tableaux

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
