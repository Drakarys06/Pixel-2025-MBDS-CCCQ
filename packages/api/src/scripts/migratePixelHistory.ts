// packages/api/src/scripts/migratePixelHistory.ts
import mongoose from 'mongoose';
import connectDB from '../db/mongoose';
import Pixel from '../models/pixel';
import PixelHistory from '../models/pixelHistory';
import User from '../models/User';

/**
 * Script pour migrer les pixels existants vers le nouveau modèle d'historique
 *
 * Ce script:
 * 1. Récupère tous les pixels existants
 * 2. Pour chaque pixel, crée une entrée dans l'historique
 * 3. Utilise les informations disponibles (date de dernière modification, utilisateurs, etc.)
 */
const migratePixelHistory = async () => {
	try {
		// Connexion à la base de données
		await connectDB();
		console.log('Connected to database');

		// Obtenir un mapping des IDs d'utilisateurs vers leurs noms d'utilisateur
		const users = await User.find({}, 'username');
		const userMap = new Map();
		users.forEach(user => {
			userMap.set(user._id.toString(), user.username);
		});

		// Récupérer tous les pixels existants
		const pixels = await Pixel.find();
		console.log(`Found ${pixels.length} pixels to migrate`);

		let created = 0;
		let errors = 0;

		// Pour chaque pixel, créer une entrée dans l'historique
		for (const pixel of pixels) {
			try {
				// Pour chaque utilisateur qui a modifié ce pixel
				for (const userId of pixel.modifiedBy) {
					// Récupérer le nom d'utilisateur si disponible, sinon utiliser l'ID
					const username = userMap.get(userId) || 'Unknown User';

					// Créer une entrée d'historique
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

// Exécuter la migration
migratePixelHistory();
