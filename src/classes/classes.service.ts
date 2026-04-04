import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
	constructor(private readonly prisma: PrismaService) {}

	findAll(page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		return this.prisma.class.findMany({
			skip,
			take: limit,
			orderBy: { startDate: 'desc' },
			select: {
				id: true,
				name: true,
				status: true,
				capacity: true,
				startDate: true,
				endDate: true,
				courseId: true,
				branchId: true,
				teacherId: true,
				course: {
					select: {
						id: true,
						name: true,
						level: true,
					},
				},
				branch: {
					select: {
						id: true,
						name: true,
						status: true,
					},
				},
				teacher: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
					},
				},
				_count: {
					select: {
						enrollments: true,
						assignments: true,
					},
				},
			},
		});
	}

	findOne(id: string) {
		return this.prisma.class.findUnique({
			where: { id },
			include: {
				course: true,
				branch: true,
				teacher: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						status: true,
					},
				},
				enrollments: {
					select: {
						id: true,
						status: true,
						enrolledAt: true,
						student: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
							},
						},
					},
					orderBy: { enrolledAt: 'desc' },
					take: 200,
				},
				assignments: {
					select: {
						id: true,
						title: true,
						dueDate: true,
						maxScore: true,
					},
					orderBy: { dueDate: 'desc' },
					take: 100,
				},
				_count: {
					select: {
						enrollments: true,
						assignments: true,
					},
				},
			},
		});
	}

	create(dto: CreateClassDto) {
		return this.prisma.class.create({
			data: {
				name: dto.name,
				courseId: dto.courseId,
				branchId: dto.branchId,
				capacity: dto.capacity,
				teacherId: dto.teacherId,
				startDate: new Date(dto.startDate),
				endDate: new Date(dto.endDate),
				status: dto.status,
			},
		});
	}

	update(id: string, dto: UpdateClassDto) {
		const data: any = {};
		if (dto.name !== undefined) data.name = dto.name;
		if (dto.courseId !== undefined) data.courseId = dto.courseId;
		if (dto.branchId !== undefined) data.branchId = dto.branchId;
		if (dto.capacity !== undefined) data.capacity = dto.capacity;
		if (dto.teacherId !== undefined) data.teacherId = dto.teacherId;
		if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
		if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
		if (dto.status !== undefined) data.status = dto.status;

		return this.prisma.class.update({
			where: { id },
			data,
		});
	}

	remove(id: string) {
		return this.prisma.class.delete({ where: { id } });
	}
}
