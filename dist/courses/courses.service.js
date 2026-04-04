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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CoursesService = class CoursesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return this.prisma.course.findMany({
            skip,
            take: limit,
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
    findOne(id) {
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
    create(dto) {
        return this.prisma.course.create({ data: dto });
    }
    update(id, dto) {
        return this.prisma.course.update({ where: { id }, data: dto });
    }
    remove(id) {
        return this.prisma.course.delete({ where: { id } });
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map