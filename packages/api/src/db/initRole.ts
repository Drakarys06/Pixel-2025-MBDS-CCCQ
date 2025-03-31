import mongoose from 'mongoose';
import { initializeDefaultRoles } from '../services/roleService';

const MONGODB_URI = 'mongodb+srv://clementcolin08:Jzx0y88eDbXmCJLD@cluster0.lhphe.mongodb.net/PixelBoard?retryWrites=true&w=majority&appName=Cluster0';

const initRoles = async () => {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('MongoDB connected successfully to PixelBoard database');

		await initializeDefaultRoles();
		console.log('Default roles initialized successfully');

		await mongoose.connection.close();
		console.log('MongoDB connection closed');

		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
};

initRoles();