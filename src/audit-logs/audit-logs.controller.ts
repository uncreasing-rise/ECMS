import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListQueryMax100Dto } from '../common/dto/list-query-max100.dto';

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  createLog(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.createLog(createAuditLogDto);
  }

  @Get()
  findLogs(@Query() query: ListQueryMax100Dto) {
    return this.auditLogsService.findLogs(query.page, query.limit, query.detail);
  }

  @Get('module/:module')
  findLogsByModule(
    @Param('module') module: string,
    @Query() query: ListQueryMax100Dto,
  ) {
    return this.auditLogsService.findLogsByModule(module, query.page, query.limit, query.detail);
  }

  @Get('actor/:actorId')
  findLogsByActor(
    @Param('actorId') actorId: string,
    @Query() query: ListQueryMax100Dto,
  ) {
    return this.auditLogsService.findLogsByActor(actorId, query.page, query.limit, query.detail);
  }

  @Get('target/:targetId/:targetType')
  findLogsByTarget(
    @Param('targetId') targetId: string,
    @Param('targetType') targetType: string,
  ) {
    return this.auditLogsService.findLogsByTarget(targetId, targetType);
  }

  @Get(':id')
  findLogById(@Param('id') id: string) {
    return this.auditLogsService.findLogById(id);
  }
}
