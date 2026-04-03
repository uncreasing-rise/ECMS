import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	findAll(page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		return this.prisma.user.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: 'desc' },
			include: { 
				userRoles: { include: { role: true } },
				branch: true,
			},
		});
	}

	findOne(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
			include: { 
				userRoles: { include: { role: true } },
				branch: true,
			},
		});
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: { email },
			include: { 
				userRoles: { include: { role: true } },
				branch: true,
			},
		});
	}

	async create(createUserDto: CreateUserDto) {
		return this.prisma.user.create({
			data: {
				firstName: createUserDto.firstName,
				lastName: createUserDto.lastName,
				email: createUserDto.email,
				phone: createUserDto.phone,
				accountType: createUserDto.accountType,
				status: createUserDto.status,
				branchId: createUserDto.branchId,
			},
			include: { 
				userRoles: { include: { role: true } },
				branch: true,
			},
		});
	}

	async update(id: string, updateUserDto: UpdateUserDto) {
		const data: {
			firstName?: string;
			lastName?: string;
			email?: string;
			phone?: string;
			accountType?: string;
			status?: string;
			branchId?: string | null;
		} = {};

		if (updateUserDto.firstName) data.firstName = updateUserDto.firstName;
		if (updateUserDto.lastName) data.lastName = updateUserDto.lastName;
		if (updateUserDto.email) data.email = updateUserDto.email;
		if (updateUserDto.phone !== undefined) data.phone = updateUserDto.phone;
		if (updateUserDto.accountType) data.accountType = updateUserDto.accountType;
		if (updateUserDto.status) data.status = updateUserDto.status;
		if (updateUserDto.branchId !== undefined) data.branchId = updateUserDto.branchId;

		return this.prisma.user.update({ 
			where: { id }, 
			data,
			include: { 
				userRoles: { include: { role: true } },
				branch: true,
			},
		});
	}

	remove(id: string) {
		return this.prisma.user.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}
}
