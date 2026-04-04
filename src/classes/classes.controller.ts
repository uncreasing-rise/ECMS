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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
	constructor(private readonly classesService: ClassesService) {}

	@Get()
	findAll(@Query() query: PaginationQueryDto) {
		return this.classesService.findAll(query.page, query.limit);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.classesService.findOne(id);
	}

	@Post()
	create(@Body() dto: CreateClassDto) {
		return this.classesService.create(dto);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
		return this.classesService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.classesService.remove(id);
	}
}
