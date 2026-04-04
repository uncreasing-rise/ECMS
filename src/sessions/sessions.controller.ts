import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListQueryDto } from '../common/dto/list-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.createSession({
      ...createSessionDto,
      expiresAt: new Date(createSessionDto.expiresAt),
    });
  }

  @Get('user/:userId')
  findUserSessions(
    @Param('userId') userId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.sessionsService.findUserSessions(userId, query.page, query.limit, query.detail);
  }

  @Get('user/:userId/active')
  findActiveSessions(@Param('userId') userId: string) {
    return this.sessionsService.findActiveSessions(userId);
  }

  @Get(':id')
  findSessionById(@Param('id') id: string) {
    return this.sessionsService.findSessionById(id);
  }

  @Patch(':id/status')
  updateSessionStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.sessionsService.updateSessionStatus(id, body.status);
  }

  @Delete(':id')
  terminateSession(@Param('id') id: string) {
    return this.sessionsService.terminateSession(id);
  }

  @Delete('user/:userId')
  revokeUserSessions(@Param('userId') userId: string) {
    return this.sessionsService.revokeUserSessions(userId);
  }
}
