import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export const EVENTS = {
  JOIN_BOARD: 'joinBoard',
  LEAVE_BOARD: 'leaveBoard',
  PIXEL_PLACED: 'pixelPlaced',
  BOARD_UPDATE: 'boardUpdate'
};

let io: Server;

export const initSocketServer = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle board join
    socket.on(EVENTS.JOIN_BOARD, (boardId: string) => {
      socket.join(`board-${boardId}`);
      console.log(`User ${socket.id} joined board ${boardId}`);
    });

    // Handle board leave
    socket.on(EVENTS.LEAVE_BOARD, (boardId: string) => {
      socket.leave(`board-${boardId}`);
      console.log(`User ${socket.id} left board ${boardId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });

  console.log('WebSocket server initialized');
};

export const emitPixelPlaced = (boardId: string, pixelData: any): void => {
  if (!io) return;
  
  io.to(`board-${boardId}`).emit(EVENTS.PIXEL_PLACED, pixelData);
};