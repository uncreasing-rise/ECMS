import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';

export interface GetCoursesParams {
  search?: string;
  includeInactive?: boolean;
  skip: number;
  take: number;
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(dto: CreateCourseDto) {
    const created = await this.prisma.courses.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        description: dto.description,
        level: dto.level,
        total_sessions: dto.total_sessions,
        price: dto.price,
        is_active: dto.is_active ?? true,
        created_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        total_sessions: true,
        price: true,
        is_active: true,
        created_at: true,
      },
    });

    return created;
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    const existing = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    return this.prisma.courses.update({
      where: { id: courseId },
      data: {
        name: dto.name,
        description: dto.description,
        level: dto.level,
        total_sessions: dto.total_sessions,
        price: dto.price,
        is_active: dto.is_active,
      },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        total_sessions: true,
        price: true,
        is_active: true,
        created_at: true,
      },
    });
  }

  async deleteCourse(courseId: string) {
    const existing = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, is_active: true },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    if (existing.is_active === false) {
      return { message: 'Khóa học đã được tắt trước đó' };
    }

    return this.prisma.courses.update({
      where: { id: courseId },
      data: { is_active: false },
      select: {
        id: true,
        name: true,
        is_active: true,
      },
    });
  }

  async getCourses(params: GetCoursesParams) {
    const where: Prisma.coursesWhereInput = {};

    if (!params.includeInactive) {
      where.is_active = true;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { level: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.courses.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          level: true,
          total_sessions: true,
          price: true,
          is_active: true,
          created_at: true,
        },
      }),
      this.prisma.courses.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  async getCourseById(courseId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        total_sessions: true,
        price: true,
        is_active: true,
        created_at: true,
        _count: {
          select: {
            classes: true,
            course_modules: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    return course;
  }
}
