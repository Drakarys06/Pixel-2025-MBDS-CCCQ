import PixelHistory, { IPixelHistory } from '../models/pixelHistory';
import mongoose from 'mongoose';

// Interface pour les données d'entrée de l'historique des pixels
interface PixelHistoryInput {
	x: number;
	y: number;
	color: string;
	userId: string;
	username: string;
	boardId: string | mongoose.Types.ObjectId;
	timestamp?: Date;
}

// Créer une nouvelle entrée d'historique de pixel
export const createPixelHistoryEntry = async (
	pixelData: PixelHistoryInput
): Promise<IPixelHistory> => {
	try {
		const pixelHistory = new PixelHistory({
			...pixelData,
			timestamp: pixelData.timestamp || new Date()
		});
		await pixelHistory.save();
		return pixelHistory;
	} catch (error) {
		console.error('Error creating pixel history entry:', error);
		throw error;
	}
};

// Récupérer l'historique des pixels pour un tableau spécifique
export const getPixelHistoryForBoard = async (
	boardId: string,
	limit?: number,
	skip?: number
): Promise<IPixelHistory[]> => {
	try {
		let query = PixelHistory.find({ boardId }).sort({ timestamp: 1 });

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		return await query.exec();
	} catch (error) {
		console.error('Error fetching pixel history:', error);
		throw error;
	}
};

// Récupérer l'historique d'un pixel spécifique par ses coordonnées
export const getPixelHistoryByCoordinates = async (
	boardId: string,
	x: number,
	y: number
): Promise<IPixelHistory[]> => {
	try {
		return await PixelHistory.find({ boardId, x, y })
			.sort({ timestamp: 1 })
			.exec();
	} catch (error) {
		console.error('Error fetching pixel history by coordinates:', error);
		throw error;
	}
};

// Récupérer le nombre total d'entrées d'historique pour un tableau
export const getPixelHistoryCount = async (boardId: string): Promise<number> => {
	try {
		return await PixelHistory.countDocuments({ boardId });
	} catch (error) {
		console.error('Error counting pixel history entries:', error);
		throw error;
	}
};

// Récupérer des "snapshots" (instantanés) du tableau à intervalles réguliers
export const getBoardSnapshots = async (
	boardId: string,
	numberOfSnapshots: number
): Promise<{ timestamp: Date; count: number }[]> => {
	try {
		const [firstEntry] = await PixelHistory.find({ boardId })
			.sort({ timestamp: 1 })
			.limit(1);

		const [lastEntry] = await PixelHistory.find({ boardId })
			.sort({ timestamp: -1 })
			.limit(1);

		if (!firstEntry || !lastEntry) {
			return [];
		}

		const startTime = firstEntry.timestamp;
		const endTime = lastEntry.timestamp;
		const totalTime = endTime.getTime() - startTime.getTime();

		const snapshots = [];
		for (let i = 0; i < numberOfSnapshots; i++) {
			const ratio = i / (numberOfSnapshots - 1);
			const snapshotTime = new Date(startTime.getTime() + totalTime * ratio);

			const count = await PixelHistory.countDocuments({
				boardId,
				timestamp: { $lte: snapshotTime }
			});

			snapshots.push({ timestamp: snapshotTime, count });
		}

		return snapshots;
	} catch (error) {
		console.error('Error generating board snapshots:', error);
		throw error;
	}
};

// Récupérer l'état du tableau à un moment précis
export const getBoardStateAtTime = async (
	boardId: string,
	timestamp: Date
): Promise<IPixelHistory[]> => {
	try {
		const pipeline = [
			{ $match: { boardId: new mongoose.Types.ObjectId(boardId), timestamp: { $lte: timestamp } } },
			{ $sort: { timestamp: 1 } },
			{
				$group: {
					_id: { x: "$x", y: "$y" },
					latestEntry: { $last: "$$ROOT" }
				}
			},
			{ $replaceRoot: { newRoot: "$latestEntry" } }
		];

		return await PixelHistory.aggregate(pipeline);
	} catch (error) {
		console.error('Error fetching board state at specific time:', error);
		throw error;
	}
};
