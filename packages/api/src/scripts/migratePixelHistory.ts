import mongoose from 'mongoose';
import connectDB from '../db/mongoose';
import Pixel from '../models/pixel';
import PixelHistory from '../models/pixelHistory';
import User from '../models/User';

const migratePixelHistory = async () => {
	try {
		await connectDB();
		console.log('Connected to database');

		const users = await User.find({}, 'username');
		const userMap = new Map();
		users.forEach(user => {
			userMap.set(user._id.toString(), user.username);
		});

		const pixels = await Pixel.find();
		console.log(`Found ${pixels.length} pixels to migrate`);

		let created = 0;
		let errors = 0;

		for (const pixel of pixels) {
			try {
				for (const userId of pixel.modifiedBy) {
					const username = userMap.get(userId) || 'Unknown User';

					await PixelHistory.create({
						x: pixel.x,
						y: pixel.y,
						color: pixel.color,
						timestamp: pixel.lastModifiedDate,
						userId: userId,
						username: username,
						boardId: pixel.boardId
					});

					created++;
				}
			} catch (err) {
				console.error(`Error migrating pixel at (${pixel.x}, ${pixel.y}) on board ${pixel.boardId}:`, err);
				errors++;
			}
		}

		console.log(`Migration completed with ${created} history entries created and ${errors} errors`);
		process.exit(0);
	} catch (err) {
		console.error('Migration failed:', err);
		process.exit(1);
	}
};

migratePixelHistory();
