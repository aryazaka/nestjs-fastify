import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLogger } from '../logger/logger.service';

@WebSocketGateway({ cors: true })
export class GatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map<userId, Set<socketId>>
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(private readonly logger: AppLogger) {}

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) {
      console.warn(`Client connected without userId: ${client.id}`);
      return; // Or handle anonymous users
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set<string>());
    }
    this.userSockets.get(userId)!.add(client.id);

    console.log(`Client connected: ${client.id}, UserID: ${userId}`);
    console.log(`Total connections for UserID ${userId}: ${this.userSockets.get(userId)!.size}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId && this.userSockets.has(userId)) {
      const userSocketSet = this.userSockets.get(userId);
      userSocketSet!.delete(client.id);

      console.log(`Client disconnected: ${client.id}, UserID: ${userId}`);

      if (userSocketSet!.size === 0) {
        this.userSockets.delete(userId);
        console.log(`No more connections for UserID ${userId}. Deleting user from map.`);
      }
    }
  }

  sendToSocket(socketId: string, event: string, data: any) {
    this.server.to(socketId).emit(event, data);
    console.log(`Sent event '${event}' to specific socket: ${socketId}`);
  }

  broadcastToUser(userId: number, event: string, data: any, excludeSocketId?: string) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      console.log(`Broadcasting event '${event}' to UserID: ${userId}`);
      for (const socketId of userSocketSet) {
        if (socketId !== excludeSocketId) {
          this.server.to(socketId).emit(event, data);
          console.log(`  -> Sent to socket: ${socketId}`);
        }
      }
    }
  }

  private getUserIdFromSocket(client: Socket): number | null {
    const userId = client.handshake.query.userId;
    if (typeof userId === 'string' && !isNaN(parseInt(userId, 10))) {
      return parseInt(userId, 10);
    }
    return null;
  }
}
