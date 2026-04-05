import { NotFoundException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface GetCoursesParams {
  search?: string;
  includeInactive?: boolean;
  skip: number;
  take: number;
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

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