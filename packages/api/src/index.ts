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

const swaggerOptions = {
	definition: {
	  openapi: '3.0.0',
	  info: {
		title: 'PixelBoard API',
		version: '1.0.0',
		description: 'A collaborative pixel art application API'
	  },
	  servers: [
		{
		  url: 'http://localhost:8000',
		  description: 'Development server'
		}
	  ],
	  components: {
		securitySchemes: {
		  bearerAuth: {
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT'
		  }
		}
	  }
	},
	apis: ['./src/routes/*.ts'],
  };

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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