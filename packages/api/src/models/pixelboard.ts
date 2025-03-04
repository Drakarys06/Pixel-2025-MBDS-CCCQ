import mongoose, { Schema, Document } from 'mongoose';

// Interface representing a PixelBoard document
export interface IPixelBoard extends Document {
  title: string;
  length: number;
  width: number;
  time: number;
  redraw: boolean;
  closeTime: Date;
  creationTime: Date;
  creator: string; // Could be a reference to User model in the future
  visitor: boolean;
}

// Create the PixelBoard schema
const PixelBoardSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  length: {
    type: Number,
    required: [true, 'Length is required'],
    min: [1, 'Length must be at least 1'],
    max: [1000, 'Length cannot exceed 1000']
  },
  width: {
    type: Number,
    required: [true, 'Width is required'],
    min: [1, 'Width must be at least 1'],
    max: [1000, 'Width cannot exceed 1000']
  },
  time: {
    type: Number,
    required: [true, 'Time is required'],
    min: [0, 'Time cannot be negative']
  },
  redraw: {
    type: Boolean,
    default: false
  },
  closeTime: {
    type: Date,
    default: null
  },
  creationTime: {
    type: Date,
    default: Date.now
  },
  creator: {
    type: String,
    required: [true, 'Creator is required']
  },
  visitor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add validation for date relationships
PixelBoardSchema.pre('validate', function(next) {
  const pixelBoard = this as IPixelBoard;
  
  if (pixelBoard.closeTime && pixelBoard.creationTime) {
    if (pixelBoard.closeTime < pixelBoard.creationTime) {
      const err = new Error('Close time cannot be before creation time');
      return next(err);
    }
  }
  
  next();
});

const PixelBoard = mongoose.model<IPixelBoard>('PixelBoard', PixelBoardSchema, 'PixelBoard');

export default PixelBoard;