import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './db/mongoose';
import { api } from './api';

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();
const port = 8000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api', api);

const options = {
	definition: {
	  openapi: '3.0.0',
	  info: {
		title: 'Pixelboard API',
		version: '1.0.0',
	  },
	},
	apis: ['./src/routes/*.js'],
  };

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
		credentials: true,
		allowedHeaders: ["Authorization", "Content-Type"]
	},
	transports: ['websocket', 'polling']
});

// WebSocket event handlers
io.on("connection", (socket) => {
	console.log('A user connected:', socket.id);

	// Handle board room joining
	socket.on('joinBoard', (boardId: string) => {
		socket.join(`board-${boardId}`);
		console.log(`User ${socket.id} joined board ${boardId}`);
	});

	// Handle board room leaving
	socket.on('leaveBoard', (boardId: string) => {
		socket.leave(`board-${boardId}`);
		console.log(`User ${socket.id} left board ${boardId}`);
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		console.log('A user disconnected:', socket.id);
	});
});

export { io };

httpServer.listen(port, () => {
	console.log(`Server listening on ${port}`);
	console.log(`WebSocket server initialized`);
});