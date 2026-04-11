import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { ChatMessage } from './chat.types.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    const token = this.extractAccessToken(client);
    const secret = this.config.get<string>('JWT_SECRET');

    if (!token || !secret) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string }>(token, { secret });
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Chat socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat:join')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversation_id?: string },
  ) {
    if (!client.userId || !data?.conversation_id) {
      return { success: false };
    }

    client.join(`conversation:${data.conversation_id}`);
    return { success: true };
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

  broadcastMessage(
    conversationId: string,
    message: ChatMessage,
    memberUserIds: string[],
  ) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('chat:message', message);
    memberUserIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('chat:message', message);
    });
  }

  broadcastConversationUpdated(
    conversationId: string,
    memberUserIds: string[],
  ) {
    const payload = { conversation_id: conversationId };
    this.server
      .to(`conversation:${conversationId}`)
      .emit('chat:conversation.updated', payload);
    memberUserIds.forEach((userId) => {
      this.server
        .to(`user:${userId}`)
        .emit('chat:conversation.updated', payload);
    });
  }
}
