import Pixel, { IPixel } from '../models/pixel';
import PixelBoard from '../models/pixelboard';
import mongoose from 'mongoose';

// Create a new pixel
export const createPixel = async (pixelData: Partial<IPixel>): Promise<IPixel> => {
	try {
		// Check if board exists
		const boardExists = await PixelBoard.exists({ _id: pixelData.boardId });
		if (!boardExists) {
			throw new Error('PixelBoard not found');
		}

		const pixel = new Pixel(pixelData);
		await pixel.save();
		return pixel;
	} catch (error) {
		throw error;
	}
};

// Get all pixels, optionally filtered by boardId
export const getAllPixels = async (boardId?: string): Promise<IPixel[]> => {
	try {
		const query = boardId ? { boardId } : {};
		const pixels = await Pixel.find(query);
		return pixels;
	} catch (error) {
		throw error;
	}
};

// Get a pixel by ID
export const getPixelById = async (id: string): Promise<IPixel | null> => {
	try {
		const pixel = await Pixel.findById(id);
		return pixel;
	} catch (error) {
		throw error;
	}
};

// Get a pixel by its position on a specific board
export const getPixelByPosition = async (boardId: string, x: number, y: number): Promise<IPixel | null> => {
	try {
		const pixel = await Pixel.findOne({ boardId, x, y });
		return pixel;
	} catch (error) {
		throw error;
	}
};

// Update a pixel
export const updatePixel = async (id: string, updates: Partial<IPixel>, userId: string): Promise<IPixel | null> => {
	try {
		// Start a session for transaction
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Find the existing pixel first
			const existingPixel = await Pixel.findById(id).session(session);
			if (!existingPixel) {
				await session.abortTransaction();
				session.endSession();
				return null;
			}

			// Add the user to modifiedBy if not already present
			if (!existingPixel.modifiedBy.includes(userId)) {
				if (!updates.modifiedBy) {
					updates.modifiedBy = [...existingPixel.modifiedBy, userId];
				} else if (!updates.modifiedBy.includes(userId)) {
					updates.modifiedBy.push(userId);
				}
			}

			// Update the lastModifiedDate
			updates.lastModifiedDate = new Date();

			// Perform the update
			const pixel = await Pixel.findByIdAndUpdate(id, updates, {
				new: true, // Return the updated document
				runValidators: true, // Validate the updates
				session
			});

			await session.commitTransaction();
			session.endSession();

			return pixel;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	} catch (error) {
		throw error;
	}
};

// Place a pixel (create or update) at specific coordinates
export const placePixel = async (boardId: string, x: number, y: number, color: string, userId: string): Promise<IPixel> => {
	try {
		// Check if board exists
		const board = await PixelBoard.findById(boardId);
		if (!board) {
			throw new Error('PixelBoard not found');
		}

		// Check if coordinates are within board dimensions
		if (x < 0 || x >= board.width || y < 0 || y >= board.length) {
			throw new Error('Coordinates are outside the board dimensions');
		}

		// Start a session for transaction
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Try to find an existing pixel at these coordinates
			let pixel = await Pixel.findOne({ boardId, x, y }).session(session);

			if (pixel) {
				// Update existing pixel
				if (!pixel.modifiedBy.includes(userId)) {
					pixel.modifiedBy.push(userId);
				}
				pixel.color = color;
				pixel.lastModifiedDate = new Date();
				await pixel.save({ session });
			} else {
				// Create new pixel
				pixel = new Pixel({
					boardId,
					x,
					y,
					color,
					modifiedBy: [userId],
					lastModifiedDate: new Date()
				});
				await pixel.save({ session });
			}

			await session.commitTransaction();
			session.endSession();

			return pixel;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	} catch (error) {
		throw error;
	}
};

// Delete a pixel
export const deletePixel = async (id: string): Promise<IPixel | null> => {
	try {
		const pixel = await Pixel.findByIdAndDelete(id);
		return pixel;
	} catch (error) {
		throw error;
	}
};
