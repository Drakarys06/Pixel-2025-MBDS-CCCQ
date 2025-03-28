import mongoose from 'mongoose';
import { initializeDefaultRoles } from '../services/roleService';

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://clementcolin08:Jzx0y88eDbXmCJLD@cluster0.lhphe.mongodb.net/PixelBoard?retryWrites=true&w=majority&appName=Cluster0';

// Script pour initialiser les rôles par défaut
const initRoles = async () => {
  try {
    // Connexion à la base de données directement
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully to PixelBoard database');
    
    // Initialiser les rôles par défaut
    await initializeDefaultRoles();
    console.log('Default roles initialized successfully');
    
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Exécuter le script
// "init-roles": "ts-node ./src/db/initRole.ts", dans package.json pour ini
initRoles();