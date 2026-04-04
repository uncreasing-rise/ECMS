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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClassesService = class ClassesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    findOne(id) {
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
    create(dto) {
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
    update(id, dto) {
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.courseId !== undefined)
            data.courseId = dto.courseId;
        if (dto.branchId !== undefined)
            data.branchId = dto.branchId;
        if (dto.capacity !== undefined)
            data.capacity = dto.capacity;
        if (dto.teacherId !== undefined)
            data.teacherId = dto.teacherId;
        if (dto.startDate !== undefined)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined)
            data.endDate = new Date(dto.endDate);
        if (dto.status !== undefined)
            data.status = dto.status;
        return this.prisma.class.update({
            where: { id },
            data,
        });
    }
    remove(id) {
        return this.prisma.class.delete({ where: { id } });
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map