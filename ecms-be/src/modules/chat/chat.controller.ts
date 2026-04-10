import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { ChatService } from './chat.service.js';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto.js';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto.js';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Tạo hoặc lấy đoạn chat direct với một user khác' })
  createDirectConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.chatService.createDirectConversation(user.id, dto.peer_user_id);
  }

  @Post('conversations/group')
  @ApiOperation({ summary: 'Tạo nhóm chat' })
  createGroupConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupConversationDto,
  ) {
    return this.chatService.createGroupConversation(user.id, dto.name, dto.member_ids);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện của tôi' })
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listConversations(user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lấy tin nhắn trong cuộc trò chuyện' })
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.chatService.getMessages(user.id, id, limit ?? 50);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn vào cuộc trò chuyện' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, id, dto.content);
  }

  @Patch('conversations/:id/delivered')
  @ApiOperation({ summary: 'Xác nhận tin đã nhận (delivered)' })
  markDelivered(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.chatService.markDelivered(user.id, id, dto.message_id);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc conversation' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.chatService.markRead(user.id, id, dto.message_id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Lấy tổng unread count của chat' })
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getUnreadCount(user.id);
  }
}
