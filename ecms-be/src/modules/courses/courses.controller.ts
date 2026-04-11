import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  DefaultValuePipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';

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
    @Query('include_inactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean = false,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number = 0,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number = 20,
  ) {
    return this.coursesService.getCourses({
      search,
      includeInactive,
      skip,
      take,
    });
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo template khóa học' })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật template khóa học' })
  updateCourse(@Param('id') courseId: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(courseId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa template khóa học (soft delete)' })
  deleteCourse(@Param('id') courseId: string) {
    return this.coursesService.deleteCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khóa học' })
  getCourseById(@Param('id') courseId: string) {
    return this.coursesService.getCourseById(courseId);
  }
}
