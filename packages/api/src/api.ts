import express, { Request, Response } from 'express';
import { articleAPI } from './routes/article';
import { pixelBoardAPI } from './routes/pixelboard';

export const api = express.Router();

api.get('/', (_req: Request, res: Response) => {
  res.json({ response: 'Hello World!' });
});

api.use('/articles', articleAPI);
api.use('/pixelboards', pixelBoardAPI);