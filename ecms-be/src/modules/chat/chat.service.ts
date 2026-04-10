import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AppException } from '../../common/api/app-exception.js';
import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { randomUUID } from 'node:crypto';
import type { ChatConversation, ChatMessage } from './chat.types.js';
import { ChatGateway } from './chat.gateway.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createDirectConversation(currentUserId: string, peerUserId: string) {
    if (currentUserId === peerUserId) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'chat.bad_request',
        message: 'Không thể tự tạo đoạn chat với chính mình',
      });
    }

    const memberIds = [currentUserId, peerUserId].sort();
    await this.assertUsersExist(memberIds);

    const directFingerprint = memberIds.join(':');
    const existing = await this.prisma.chat_conversations.findUnique({
      where: { direct_fingerprint: directFingerprint },
      include: { chat_members: { select: { user_id: true } } },
    });

    if (existing) {
      return this.toConversationDto(existing, currentUserId);
    }

    const now = new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.chat_conversations.create({
        data: {
          id: randomUUID(),
          type: 'direct',
          created_by: currentUserId,
          direct_fingerprint: directFingerprint,
          created_at: now,
          updated_at: now,
        },
      });

      await tx.chat_conversation_members.createMany({
        data: memberIds.map((userId) => ({
          id: randomUUID(),
          conversation_id: conversation.id,
          user_id: userId,
          joined_at: now,
          unread_count: 0,
        })),
      });

      return tx.chat_conversations.findUniqueOrThrow({
        where: { id: conversation.id },
        include: {
          chat_members: {
            select: {
              user_id: true,
              unread_count: true,
              last_delivered_message_id: true,
              last_read_message_id: true,
            },
          },
        },
      });
    });

    return this.toConversationDto(created, currentUserId);
  }

  async createGroupConversation(
    currentUserId: string,
    name: string,
    memberIds: string[],
  ) {
    const uniqueMemberIds = Array.from(new Set([...memberIds, currentUserId]));
    await this.assertUsersExist(uniqueMemberIds);

    const now = new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.chat_conversations.create({
        data: {
          id: randomUUID(),
          type: 'group',
          name,
          created_by: currentUserId,
          created_at: now,
          updated_at: now,
        },
      });

      await tx.chat_conversation_members.createMany({
        data: uniqueMemberIds.map((userId) => ({
          id: randomUUID(),
          conversation_id: conversation.id,
          user_id: userId,
          joined_at: now,
          unread_count: 0,
        })),
      });

      return tx.chat_conversations.findUniqueOrThrow({
        where: { id: conversation.id },
        include: {
          chat_members: {
            select: {
              user_id: true,
              unread_count: true,
              last_delivered_message_id: true,
              last_read_message_id: true,
            },
          },
        },
      });
    });

    return this.toConversationDto(created, currentUserId);
  }

  async listConversations(currentUserId: string) {
    const conversations = await this.prisma.chat_conversations.findMany({
      where: {
        chat_members: {
          some: { user_id: currentUserId },
        },
      },
      include: {
        chat_members: {
          select: {
            user_id: true,
            unread_count: true,
            last_delivered_message_id: true,
            last_read_message_id: true,
          },
        },
      },
      orderBy: [{ last_message_at: 'desc' }, { updated_at: 'desc' }],
    });

    return conversations.map((it) => this.toConversationDto(it, currentUserId));
  }

  async getMessages(currentUserId: string, conversationId: string, limit = 50) {
    await this.assertConversationMember(currentUserId, conversationId);

    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const rows = await this.prisma.chat_messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'desc' },
      take: safeLimit,
    });

    const messages = rows
      .reverse()
      .map((row) => this.toMessageDto(row));

    if (messages.length > 0) {
      await this.markDelivered(
        currentUserId,
        conversationId,
        messages[messages.length - 1].id,
      );
    }

    return messages;
  }

  async sendMessage(currentUserId: string, conversationId: string, content: string) {
    const membership = await this.assertConversationMember(
      currentUserId,
      conversationId,
    );
    const now = new Date();

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.chat_messages.create({
        data: {
          id: randomUUID(),
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          created_at: now,
        },
      });

      await tx.chat_conversations.update({
        where: { id: conversationId },
        data: {
          updated_at: now,
          last_message_at: now,
          last_message_preview: content.slice(0, 120),
        },
      });

      await tx.chat_conversation_members.updateMany({
        where: {
          conversation_id: conversationId,
          user_id: { not: currentUserId },
        },
        data: {
          unread_count: { increment: 1 },
        },
      });

      await tx.chat_conversation_members.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: currentUserId,
          },
        },
        data: {
          unread_count: 0,
          last_delivered_message_id: createdMessage.id,
          last_delivered_at: now,
          last_read_message_id: createdMessage.id,
          last_read_at: now,
        },
      });

      return createdMessage;
    });

    const messageDto = this.toMessageDto(message);
    const memberIds = membership.chat_conversations.chat_members.map(
      (member) => member.user_id,
    );

    this.chatGateway.broadcastMessage(conversationId, messageDto, memberIds);
    this.chatGateway.broadcastConversationUpdated(conversationId, memberIds);

    return messageDto;
  }

  async markDelivered(
    currentUserId: string,
    conversationId: string,
    messageId?: string,
  ) {
    await this.assertConversationMember(currentUserId, conversationId);

    const targetMessage =
      messageId ??
      (
        await this.prisma.chat_messages.findFirst({
          where: { conversation_id: conversationId },
          orderBy: { created_at: 'desc' },
          select: { id: true },
        })
      )?.id;

    if (!targetMessage) {
      return { delivered: false };
    }

    await this.prisma.chat_conversation_members.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: currentUserId,
        },
      },
      data: {
        last_delivered_message_id: targetMessage,
        last_delivered_at: new Date(),
      },
    });

    return { delivered: true, message_id: targetMessage };
  }

  async markRead(currentUserId: string, conversationId: string, messageId?: string) {
    await this.assertConversationMember(currentUserId, conversationId);

    const targetMessage =
      messageId ??
      (
        await this.prisma.chat_messages.findFirst({
          where: { conversation_id: conversationId },
          orderBy: { created_at: 'desc' },
          select: { id: true },
        })
      )?.id;

    if (!targetMessage) {
      return { read: false };
    }

    await this.prisma.chat_conversation_members.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: currentUserId,
        },
      },
      data: {
        unread_count: 0,
        last_read_message_id: targetMessage,
        last_read_at: new Date(),
        last_delivered_message_id: targetMessage,
        last_delivered_at: new Date(),
      },
    });

    return { read: true, message_id: targetMessage };
  }

  async getUnreadCount(currentUserId: string) {
    const aggregated = await this.prisma.chat_conversation_members.aggregate({
      where: { user_id: currentUserId },
      _sum: { unread_count: true },
    });

    return { count: aggregated._sum.unread_count ?? 0 };
  }

  private async assertUsersExist(userIds: string[]) {
    const users = await this.prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    const found = new Set(users.map((u) => u.id));

    if (userIds.some((id) => !found.has(id))) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'chat.not_found',
        message: 'Không tìm thấy người dùng trong cuộc trò chuyện',
      });
    }
  }

  private async assertConversationMember(currentUserId: string, conversationId: string) {
    const membership = await this.prisma.chat_conversation_members.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: currentUserId,
        },
      },
      include: {
        chat_conversations: {
          include: {
            chat_members: { select: { user_id: true } },
          },
        },
      },
    });

    if (!membership) {
      throw new AppException({
        code: AppErrorCode.FORBIDDEN,
        errorKey: 'chat.forbidden',
        message: 'Bạn không có quyền truy cập cuộc trò chuyện này',
      });
    }

    return membership;
  }

  private toConversationDto(
    conversation: {
      id: string;
      type: string;
      name: string | null;
      created_by: string;
      created_at: Date | null;
      updated_at: Date | null;
      last_message_at: Date | null;
      last_message_preview: string | null;
      chat_members: Array<{
        user_id: string;
        unread_count?: number | null;
        last_delivered_message_id?: string | null;
        last_read_message_id?: string | null;
      }>;
    },
    currentUserId: string,
  ): ChatConversation {
    const mine = conversation.chat_members.find((m) => m.user_id === currentUserId);

    return {
      id: conversation.id,
      type: conversation.type === 'group' ? 'group' : 'direct',
      name: conversation.name ?? undefined,
      member_ids: conversation.chat_members.map((m) => m.user_id),
      created_by: conversation.created_by,
      created_at: (conversation.created_at ?? new Date()).toISOString(),
      updated_at: (conversation.updated_at ?? new Date()).toISOString(),
      last_message_at: conversation.last_message_at?.toISOString(),
      last_message_preview: conversation.last_message_preview ?? undefined,
      my_state: {
        unread_count: mine?.unread_count ?? 0,
        last_delivered_message_id: mine?.last_delivered_message_id,
        last_read_message_id: mine?.last_read_message_id,
      },
    };
  }

  private toMessageDto(row: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: Date | null;
  }): ChatMessage {
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      created_at: (row.created_at ?? new Date()).toISOString(),
    };
  }
}
