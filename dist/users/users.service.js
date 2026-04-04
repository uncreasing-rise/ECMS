"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    findOne(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: { include: { role: true } },
                branch: true,
            },
        });
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                userRoles: { include: { role: true } },
                branch: true,
            },
        });
    }
    async create(createUserDto) {
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
    async update(id, updateUserDto) {
        const data = {};
        if (updateUserDto.firstName)
            data.firstName = updateUserDto.firstName;
        if (updateUserDto.lastName)
            data.lastName = updateUserDto.lastName;
        if (updateUserDto.email)
            data.email = updateUserDto.email;
        if (updateUserDto.phone !== undefined)
            data.phone = updateUserDto.phone;
        if (updateUserDto.accountType)
            data.accountType = updateUserDto.accountType;
        if (updateUserDto.status)
            data.status = updateUserDto.status;
        if (updateUserDto.branchId !== undefined)
            data.branchId = updateUserDto.branchId;
        return this.prisma.user.update({
            where: { id },
            data,
            include: {
                userRoles: { include: { role: true } },
                branch: true,
            },
        });
    }
    remove(id) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map