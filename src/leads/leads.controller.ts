import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListQueryDto } from '../common/dto/list-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // Lead endpoints
  @Post()
  createLead(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.createLead(createLeadDto);
  }

  @Get()
  findAllLeads(@Query() query: ListQueryDto) {
    return this.leadsService.findAllLeads(query.page, query.limit, query.detail);
  }

  @Get('owner/:ownerId')
  findLeadsByOwner(
    @Param('ownerId') ownerId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.leadsService.findLeadsByOwner(ownerId, query.page, query.limit, query.detail);
  }

  @Get('status/:status')
  findLeadsByStatus(
    @Param('status') status: string,
    @Query() query: ListQueryDto,
  ) {
    return this.leadsService.findLeadsByStatus(status, query.page, query.limit, query.detail);
  }

  @Get(':id')
  findLeadById(@Param('id') id: string) {
    return this.leadsService.findLeadById(id);
  }

  @Patch(':id')
  updateLead(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.updateLead(id, updateLeadDto);
  }

  @Patch(':id/status')
  updateLeadStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.leadsService.updateLeadStatus(id, body.status);
  }

  // Consultation endpoints
  @Post(':leadId/consultations')
  logConsultation(
    @Param('leadId') leadId: string,
    @Body() createConsultationDto: CreateConsultationDto,
  ) {
    return this.leadsService.logConsultation({
      ...createConsultationDto,
      leadId,
      date: new Date(createConsultationDto.date),
      followUpDate: createConsultationDto.followUpDate ? new Date(createConsultationDto.followUpDate) : undefined,
    });
  }

  @Get(':leadId/consultations')
  findLeadConsultations(@Param('leadId') leadId: string) {
    return this.leadsService.findLeadConsultations(leadId);
  }

  @Get(':leadId/history')
  getLeadStatusHistory(@Param('leadId') leadId: string) {
    return this.leadsService.getLeadStatusHistory(leadId);
  }
}
