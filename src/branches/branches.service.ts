import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
	constructor(private readonly prisma: PrismaService) {}

	findAll() {
		return this.prisma.branch.findMany({
			orderBy: { name: 'asc' },
			include: { parentBranch: true, childBranches: true },
		});
	}

	findOne(id: string) {
		return this.prisma.branch.findUnique({
			where: { id },
			include: { parentBranch: true, childBranches: true, users: true },
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
