import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IRole } from '../models/Role';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  pixelsPlaced: number;
  boardsCreated: number;
  roles: mongoose.Types.ObjectId[] | IRole[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): Promise<boolean>;
  hasRole(roleName: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot be more than 30 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  pixelsPlaced: {
    type: Number,
    default: 0
  },
  boardsCreated: {
    type: Number,
    default: 0
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }]
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre<IUser>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to check if user has a specific permission
UserSchema.methods.hasPermission = async function(permission: string): Promise<boolean> {
  try {
    const user = this as IUser;
    
    // Populate roles if not already populated
    if (!user.populated('roles')) {
      await user.populate('roles');
    }
    
    const userRoles = user.roles as IRole[];
    
    // Check if any of the user's roles have the required permission
    return userRoles.some(role => role.permissions.includes(permission));
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Method to check if user has a specific role
UserSchema.methods.hasRole = async function(roleName: string): Promise<boolean> {
  try {
    const user = this as IUser;
    
    // Populate roles if not already populated
    if (!user.populated('roles')) {
      await user.populate('roles');
    }
    
    const userRoles = user.roles as IRole[];
    
    // Check if user has the specified role
    return userRoles.some(role => role.name === roleName);
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema);