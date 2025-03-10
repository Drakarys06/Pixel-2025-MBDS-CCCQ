import express, { Request, Response } from 'express';
import { articleAPI } from './routes/article';
import { pixelBoardAPI } from './routes/pixelboard';
import { pixelAPI } from './routes/pixel';
import authRoutes from './routes/auth';

export const api = express.Router();

api.get('/', (_req: Request, res: Response) => {
  res.json({ response: 'Hello World!' });
});

// Ajout des routes d'authentification
api.use('/auth', authRoutes);

api.use('/articles', articleAPI);
api.use('/pixelboards', pixelBoardAPI);
api.use('/pixels', pixelAPI);