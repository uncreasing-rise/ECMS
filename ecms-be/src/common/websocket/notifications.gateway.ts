import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // user_id -> set of socket.ids

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Register user for real-time notifications
   * Client should emit: socket.emit('register', { user_id: 'uuid' })
   */
  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { user_id: string },
  ) {
    client.userId = data.user_id;
    
    if (!this.userSockets.has(data.user_id)) {
      this.userSockets.set(data.user_id, new Set());
    }
    this.userSockets.get(data.user_id)!.add(client.id);

    client.emit('registered', { user_id: data.user_id });
    this.logger.log(`User ${data.user_id} registered via socket ${client.id}`);
    
    return { success: true, user_id: data.user_id };
  }

  /**
   * Broadcast real-time notification to specific user
   */
  broadcastToUser(user_id: string, notification: any) {
    const sockets = this.userSockets.get(user_id);
    if (!sockets || sockets.size === 0) {
      this.logger.warn(`No connected sockets for user: ${user_id}`);
      return false;
    }

    sockets.forEach((socketId) => {
      this.server.to(socketId).emit('notification', notification);
    });

    this.logger.log(`Real-time notification sent to ${sockets.size} sockets of user ${user_id}`);
    return true;
  }

  /**
   * Broadcast to multiple users
   */
  broadcastToUsers(user_ids: string[], notification: any) {
    let broadcastCount = 0;
    user_ids.forEach((user_id) => {
      const sockets = this.userSockets.get(user_id);
      if (sockets && sockets.size > 0) {
        sockets.forEach((socketId) => {
          this.server.to(socketId).emit('notification', notification);
          broadcastCount++;
        });
      }
    });

    this.logger.log(`Real-time notification sent to ${broadcastCount} sockets across ${user_ids.length} users`);
    return broadcastCount;
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log(`Broadcast notification to all connected users`);
  }

  /**
   * Get online user count
   */
  getOnlineCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(user_id: string): boolean {
    const sockets = this.userSockets.get(user_id);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get user's socket count
   */
  getUserSocketCount(user_id: string): number {
    const sockets = this.userSockets.get(user_id);
    return sockets ? sockets.size : 0;
  }
}
