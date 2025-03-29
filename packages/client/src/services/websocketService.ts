import { io, Socket } from 'socket.io-client';

export const EVENTS = {
    JOIN_BOARD: 'joinBoard',
    LEAVE_BOARD: 'leaveBoard',
    PIXEL_PLACED: 'pixelPlaced'
};

class WebSocketService {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private connecting: boolean = false;
    private API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Initialize socket connection
    connect(): void {
        // Add better protection against multiple connection attempts
        if (this.connected || this.connecting || this.socket) return;

        this.connecting = true;
        console.log('Connecting to WebSocket server at:', this.API_URL);

        this.socket = io(this.API_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected with ID:', this.socket?.id);
            this.connected = true;
            this.connecting = false;
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.connected = false;
            this.connecting = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            this.connecting = false;
        });
    }

    // Join a board room
    joinBoard(boardId: string): void {
        if (!this.socket || !this.connected) return;
        console.log(`Joining board room: board-${boardId}`);
        this.socket.emit(EVENTS.JOIN_BOARD, boardId);
    }

    // Leave a board room
    leaveBoard(boardId: string): void {
        if (!this.socket || !this.connected) return;
        console.log(`Leaving board room: board-${boardId}`);
        this.socket.emit(EVENTS.LEAVE_BOARD, boardId);
    }

    // Listener for pixel placed events
    onPixelPlaced(callback: (pixelData: any) => void): void {
        if (!this.socket) {
            console.log("Cannot listen for pixel events: socket not connected");
            return;
        }

        console.log("Setting up listener for pixelPlaced events");
        this.socket.on('pixelPlaced', callback);
    }

    // Remove event listener
    removeListener(event: string): void {
        if (!this.socket) return;
        this.socket.off(event);
    }

    isConnected(): boolean {
        return this.connected;
    }

    // Disconnect
    disconnect(): void {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
        this.connecting = false;
    }
}

// Create and export a singleton instance
const websocketService = new WebSocketService();
export default websocketService;