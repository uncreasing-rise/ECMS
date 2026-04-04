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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
	constructor(private readonly coursesService: CoursesService) {}

	@Get()
	findAll(@Query() query: ListQueryDto) {
		return this.coursesService.findAll(query.page, query.limit, query.detail);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.coursesService.findOne(id);
	}

	@Post()
	create(@Body() dto: CreateCourseDto) {
		return this.coursesService.create(dto);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
		return this.coursesService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.coursesService.remove(id);
	}
}
