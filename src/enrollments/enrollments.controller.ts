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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
	constructor(private readonly enrollmentsService: EnrollmentsService) {}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.enrollmentsService.findAll(query.page, query.limit, query.detail);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.enrollmentsService.findOne(id);
	}

	@Post()
	create(@Body() dto: CreateEnrollmentDto) {
		return this.enrollmentsService.create(dto);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
		return this.enrollmentsService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.enrollmentsService.remove(id);
	}
}
