import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
	constructor(private readonly prisma: PrismaService) {}

	findAll(page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		return this.prisma.branch.findMany({
			skip,
			take: limit,
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				status: true,
				location: true,
				timezone: true,
				currency: true,
				parentBranchId: true,
				parentBranch: {
					select: {
						id: true,
						name: true,
						status: true,
					},
				},
				_count: {
					select: {
						childBranches: true,
						users: true,
						classes: true,
						leads: true,
					},
				},
			},
		});
	}

	findOne(id: string) {
		return this.prisma.branch.findUnique({
			where: { id },
			include: {
				parentBranch: true,
				childBranches: {
					select: {
						id: true,
						name: true,
						status: true,
					},
					orderBy: { name: 'asc' },
					take: 50,
				},
				users: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						status: true,
						accountType: true,
					},
					orderBy: { createdAt: 'desc' },
					take: 100,
				},
				_count: {
					select: {
						childBranches: true,
						users: true,
						classes: true,
						leads: true,
					},
				},
			},
		});
	}

	create(createBranchDto: CreateBranchDto) {
		return this.prisma.branch.create({ data: createBranchDto });
	}

	update(id: string, updateBranchDto: UpdateBranchDto) {
		return this.prisma.branch.update({ where: { id }, data: updateBranchDto });
	}

	remove(id: string) {
		return this.prisma.branch.delete({ where: { id } });
	}
}
