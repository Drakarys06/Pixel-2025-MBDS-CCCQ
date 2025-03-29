import mongoose, { Schema, Document } from 'mongoose';

// Interface representing a Pixel document
export interface IPixel extends Document {
	x: number;
	y: number;
	color: string;
	lastModifiedDate: Date;
	modifiedBy: string[]; // Array of users who modified this pixel
	boardId: mongoose.Types.ObjectId; // Reference to the parent PixelBoard
}

// Create the Pixel schema
const PixelSchema: Schema = new Schema({
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
	lastModifiedDate: {
		type: Date,
		default: Date.now
	},
	modifiedBy: [{
		type: String,
		required: [true, 'User identifier is required']
	}],
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'PixelBoard',
		required: [true, 'Board ID is required']
	}
}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

// Create a compound index for unique pixel positions within a board
PixelSchema.index({ x: 1, y: 1, boardId: 1 }, { unique: true });

// Update lastModifiedDate whenever a pixel is modified
PixelSchema.pre('save', function(next) {
	const pixel = this as IPixel;
	pixel.lastModifiedDate = new Date();
	next();
});

const Pixel = mongoose.model<IPixel>('Pixel', PixelSchema, 'Pixel');

export default Pixel;