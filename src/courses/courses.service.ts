import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
	constructor(private readonly prisma: PrismaService) {}

	findAll(page = 1, limit = 20, detail = false) {
		const safeLimit = Math.min(Math.max(limit, 1), 50);
		const skip = (page - 1) * safeLimit;

		if (detail) {
			return this.prisma.course.findMany({
				skip,
				take: safeLimit,
				orderBy: { name: 'asc' },
				include: {
					classes: {
						select: {
							id: true,
							name: true,
							status: true,
							startDate: true,
							endDate: true,
							capacity: true,
						},
						orderBy: { startDate: 'desc' },
						take: 50,
					},
					_count: {
						select: {
							classes: true,
						},
					},
				},
			});
		}

		return this.prisma.course.findMany({
			skip,
			take: safeLimit,
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				level: true,
				status: true,
				durationWeeks: true,
				_count: {
					select: {
						classes: true,
						coursePrerequisites: true,
						isPrerequisiteOf: true,
					},
				},
			},
		});
	}

	findOne(id: string) {
		return this.prisma.course.findUnique({
			where: { id },
			include: {
				classes: {
					select: {
						id: true,
						name: true,
						status: true,
						startDate: true,
						endDate: true,
						capacity: true,
					},
					orderBy: { startDate: 'desc' },
					take: 100,
				},
				coursePrerequisites: true,
				isPrerequisiteOf: true,
				_count: {
					select: {
						classes: true,
					},
				},
			},
		});
	}

	create(dto: CreateCourseDto) {
		return this.prisma.course.create({ data: dto });
	}

	update(id: string, dto: UpdateCourseDto) {
		return this.prisma.course.update({ where: { id }, data: dto });
	}

	remove(id: string) {
		return this.prisma.course.delete({ where: { id } });
	}
}
