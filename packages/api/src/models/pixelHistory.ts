import mongoose, { Schema, Document } from 'mongoose';

// Interface représentant un document d'historique de pixel
export interface IPixelHistory extends Document {
	x: number;
	y: number;
	color: string;
	timestamp: Date;
	userId: string;
	username: string;
	boardId: mongoose.Types.ObjectId;
}

// Créer le schéma pour l'historique des pixels
const PixelHistorySchema: Schema = new Schema({
	x: {
		type: Number,
		required: [true, 'X coordinate is required'],
		min: [0, 'X coordinate must be at least 0']
	},
	y: {
		type: Number,
		required: [true, 'Y coordinate is required'],
		min: [0, 'Y coordinate must be at least 0']
	},
	color: {
		type: String,
		required: [true, 'Color is required'],
		match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
	},
	timestamp: {
		type: Date,
		default: Date.now
	},
	userId: {
		type: String,
		required: [true, 'User identifier is required']
	},
	username: {
		type: String,
		required: [true, 'Username is required']
	},
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'PixelBoard',
		required: [true, 'Board ID is required']
	}
}, {
	timestamps: true
});

// Créer un index composé pour accélérer les recherches
PixelHistorySchema.index({ boardId: 1, timestamp: 1 });
PixelHistorySchema.index({ boardId: 1, x: 1, y: 1, timestamp: 1 });

const PixelHistory = mongoose.model<IPixelHistory>('PixelHistory', PixelHistorySchema, 'PixelHistory');

export default PixelHistory;
