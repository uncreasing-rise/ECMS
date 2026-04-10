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
import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationRealtimeBus } from '../../modules/notifications/notification-realtime.bus.js';

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
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly realtimeBus: NotificationRealtimeBus,
  ) {}

  async onModuleInit() {
    await this.realtimeBus.subscribe(async (message) => {
      this.broadcastToUser(message.userId, message.notification);
    });
  }

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

    client.join(userId);

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
    this.server.to(user_id).emit('notification', notification);
    this.logger.log(`Real-time notification broadcast to room ${user_id}`);
    return true;
  }

  /**
   * Broadcast to multiple users
   */
  broadcastToUsers(user_ids: string[], notification: NotificationPayload) {
    const uniqueUserIds = Array.from(new Set(user_ids));
    uniqueUserIds.forEach((user_id) => {
      this.server.to(user_id).emit('notification', notification);
    });

    this.logger.log(
      `Real-time notification broadcast to ${uniqueUserIds.length} user rooms`,
    );
    return uniqueUserIds.length;
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
    return this.server?.sockets?.sockets?.size ?? 0;
  }

  /**
   * Check if user is online
   */
  async isUserOnline(user_id: string): Promise<boolean> {
    const sockets = await this.server.in(user_id).fetchSockets();
    return sockets.length > 0;
  }

  /**
   * Get user's socket count
   */
  async getUserSocketCount(user_id: string): Promise<number> {
    const sockets = await this.server.in(user_id).fetchSockets();
    return sockets.length;
  }
}
