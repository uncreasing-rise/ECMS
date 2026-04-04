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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(page = 1, limit = 20, detail = false) {
        const safeLimit = Math.min(Math.max(limit, 1), 50);
        const skip = (page - 1) * safeLimit;
        if (detail) {
            return this.prisma.branch.findMany({
                skip,
                take: safeLimit,
                orderBy: { name: 'asc' },
                include: {
                    parentBranch: true,
                    childBranches: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                        },
                        take: 20,
                    },
                    users: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                        take: 20,
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
        return this.prisma.branch.findMany({
            skip,
            take: safeLimit,
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
    findOne(id) {
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
    create(createBranchDto) {
        return this.prisma.branch.create({ data: createBranchDto });
    }
    update(id, updateBranchDto) {
        return this.prisma.branch.update({ where: { id }, data: updateBranchDto });
    }
    remove(id) {
        return this.prisma.branch.delete({ where: { id } });
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map