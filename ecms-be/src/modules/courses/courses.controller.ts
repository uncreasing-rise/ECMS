import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CoursesService } from './courses.service.js';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khóa học' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'include_inactive', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getCourses(
    @Query('search') search?: string,
    @Query('include_inactive') includeInactive?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.coursesService.getCourses({
      search,
      includeInactive: includeInactive === 'true',
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khóa học' })
  getCourseById(@Param('id') courseId: string) {
    return this.coursesService.getCourseById(courseId);
  }
}