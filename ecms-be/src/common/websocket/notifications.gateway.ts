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
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

type NotificationPayload = Record<string, unknown>;

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // user_id -> set of socket.ids

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    const token = this.extractAccessToken(client);
    const secret = this.config.get<string>('JWT_SECRET');

    if (!token || !secret) {
      this.logger.warn(
        `Socket ${client.id} rejected: missing token or JWT secret`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(token, {
        secret,
      });
      if (!payload?.sub) {
        this.logger.warn(
          `Socket ${client.id} rejected: missing user id in token payload`,
        );
        client.disconnect(true);
        return;
      }

      client.userId = payload.sub;
    } catch {
      this.logger.warn(`Socket ${client.id} rejected: invalid JWT`);
      client.disconnect(true);
      return;
    }

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
    @MessageBody() data?: { user_id?: string },
  ) {
    if (!client.userId) {
      this.logger.warn(
        `Socket ${client.id} attempted register without authentication`,
      );
      client.disconnect(true);
      return { success: false, message: 'Unauthorized' };
    }

    if (data?.user_id && data.user_id !== client.userId) {
      this.logger.warn(
        `Socket ${client.id} attempted to spoof user ${data.user_id}`,
      );
    }

    const userId = client.userId;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    client.emit('registered', { user_id: userId });
    this.logger.log(`User ${userId} registered via socket ${client.id}`);

    return { success: true, user_id: userId };
  }

  private extractAccessToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (
      typeof authHeader === 'string' &&
      authHeader.toLowerCase().startsWith('bearer ')
    ) {
      return authHeader.slice(7).trim();
    }

    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      if (authToken.toLowerCase().startsWith('bearer ')) {
        return authToken.slice(7).trim();
      }
      return authToken.trim();
    }

    return null;
  }

  /**
   * Broadcast real-time notification to specific user
   */
  broadcastToUser(user_id: string, notification: NotificationPayload) {
    const sockets = this.userSockets.get(user_id);
    if (!sockets || sockets.size === 0) {
      this.logger.warn(`No connected sockets for user: ${user_id}`);
      return false;
    }

    sockets.forEach((socketId) => {
      this.server.to(socketId).emit('notification', notification);
    });

    this.logger.log(
      `Real-time notification sent to ${sockets.size} sockets of user ${user_id}`,
    );
    return true;
  }

  /**
   * Broadcast to multiple users
   */
  broadcastToUsers(user_ids: string[], notification: NotificationPayload) {
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

    this.logger.log(
      `Real-time notification sent to ${broadcastCount} sockets across ${user_ids.length} users`,
    );
    return broadcastCount;
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(notification: NotificationPayload) {
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
