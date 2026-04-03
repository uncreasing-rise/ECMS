import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
	constructor(private readonly prisma: PrismaService) {}

	findAll() {
		return this.prisma.enrollment.findMany({
			orderBy: { enrolledAt: 'desc' },
			include: { student: true, class: true },
		});
	}

	findOne(id: string) {
		return this.prisma.enrollment.findUnique({
			where: { id },
			include: { student: true, class: true },
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
