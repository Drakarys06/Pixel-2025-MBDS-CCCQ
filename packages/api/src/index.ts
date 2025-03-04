import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './db/mongoose';
import { api } from './api';

const app = express();  
const port = 8000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json('Hello World!');
});

app.use('/api', api);

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});