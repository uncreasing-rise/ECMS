import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
	constructor(private readonly prisma: PrismaService) {}

	findAll(page = 1, limit = 20, detail = false) {
		const safeLimit = Math.min(Math.max(limit, 1), 50);
		const skip = (page - 1) * safeLimit;

		if (detail) {
			return this.prisma.enrollment.findMany({
				skip,
				take: safeLimit,
				orderBy: { enrolledAt: 'desc' },
				include: {
					student: true,
					class: {
						include: {
							course: true,
							branch: true,
						},
					},
				},
			});
		}

		return this.prisma.enrollment.findMany({
			skip,
			take: safeLimit,
			orderBy: { enrolledAt: 'desc' },
			select: {
				id: true,
				classId: true,
				studentId: true,
				status: true,
				enrolledAt: true,
				student: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						status: true,
					},
				},
				class: {
					select: {
						id: true,
						name: true,
						status: true,
						startDate: true,
						endDate: true,
					},
				},
			},
		});
	}

	findOne(id: string) {
		return this.prisma.enrollment.findUnique({
			where: { id },
			include: {
				student: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						status: true,
						accountType: true,
					},
				},
				class: {
					select: {
						id: true,
						name: true,
						status: true,
						startDate: true,
						endDate: true,
						capacity: true,
					},
				},
			},
		});
	}

	create(dto: CreateEnrollmentDto) {
		return this.prisma.enrollment.create({
			data: {
				studentId: dto.studentId,
				classId: dto.classId,
				status: dto.status,
			},
			include: { student: true, class: true },
		});
	}

	update(id: string, dto: UpdateEnrollmentDto) {
		return this.prisma.enrollment.update({ where: { id }, data: dto });
	}

	remove(id: string) {
		return this.prisma.enrollment.delete({ where: { id } });
	}
}
