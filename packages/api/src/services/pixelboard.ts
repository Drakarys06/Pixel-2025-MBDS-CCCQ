import PixelBoard, { IPixelBoard } from '../models/pixelboard';

// Interface pour les données de création d'un pixel board
interface PixelBoardInput {
	title: string;
	length: number;
	width: number;
	time: number;
	redraw?: boolean;
	creator: string;
	creatorUsername: string;
	visitor?: boolean;
	cooldown?: number;
}

// Create a new pixel board
export const createPixelBoard = async (pixelBoardData: PixelBoardInput): Promise<IPixelBoard> => {
	try {
		const pixelBoard = new PixelBoard(pixelBoardData);
		await pixelBoard.save();
		return pixelBoard;
	} catch (error) {
		throw error;
	}
};

// Get all pixel boards
export const getAllPixelBoards = async (): Promise<IPixelBoard[]> => {
	try {
		const pixelBoards = await PixelBoard.find();
		return pixelBoards;
	} catch (error) {
		throw error;
	}
};

// Get a pixel board by ID
export const getPixelBoardById = async (id: string): Promise<IPixelBoard | null> => {
	try {
		const pixelBoard = await PixelBoard.findById(id);
		return pixelBoard;
	} catch (error) {
		throw error;
	}
};

// Get pixel boards created by a specific user
export const getPixelBoardsByCreator = async (creatorId: string): Promise<IPixelBoard[]> => {
	try {
		const pixelBoards = await PixelBoard.find({ creator: creatorId });
		return pixelBoards;
	} catch (error) {
		throw error;
	}
};

// Get pixel boards where a user has contributed (placed at least one pixel)
export const getPixelBoardsWithUserContribution = async (userId: string): Promise<IPixelBoard[]> => {
	try {
		const pixelBoards = await PixelBoard.find({
			"contributors.userId": userId
		});

		return pixelBoards;
	} catch (error) {
		throw error;
	}
};

// Update a pixel board
export const updatePixelBoard = async (id: string, updates: Partial<IPixelBoard>): Promise<IPixelBoard | null> => {
	try {
		const pixelBoard = await PixelBoard.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true
		});
		return pixelBoard;
	} catch (error) {
		throw error;
	}
};

// Delete a pixel board
export const deletePixelBoard = async (id: string): Promise<IPixelBoard | null> => {
	try {
		const pixelBoard = await PixelBoard.findByIdAndDelete(id);
		return pixelBoard;
	} catch (error) {
		throw error;
	}
};