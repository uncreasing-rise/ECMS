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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPayrollRun(data) {
        return this.prisma.payrollRun.create({
            data: {
                branchId: data.branchId,
                periodYear: data.periodYear,
                periodMonth: data.periodMonth,
                totalTeachers: data.totalTeachers,
                grossAmount: typeof data.grossAmount === 'string' ? parseFloat(data.grossAmount) : data.grossAmount,
                netAmount: typeof data.netAmount === 'string' ? parseFloat(data.netAmount) : data.netAmount,
                status: data.status,
                runBy: data.runBy,
            },
        });
    }
    async listPayrollRuns(branchId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return this.prisma.payrollRun.findMany({
            where: branchId ? { branchId } : undefined,
            skip,
            take: limit,
            orderBy: { runAt: 'desc' },
            select: {
                id: true,
                branchId: true,
                periodYear: true,
                periodMonth: true,
                totalTeachers: true,
                grossAmount: true,
                netAmount: true,
                status: true,
                runAt: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
                runByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }
    async createSessionPay(data) {
        return this.prisma.sessionPay.create({
            data: {
                teacherId: data.teacherId,
                branchId: data.branchId,
                sessionDate: new Date(data.sessionDate),
                sessionCount: data.sessionCount,
                amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
                bonus: data.bonus ? (typeof data.bonus === 'string' ? parseFloat(data.bonus) : data.bonus) : 0,
                payrollRunId: data.payrollRunId,
            },
        });
    }
    async listSessionPays(teacherId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return this.prisma.sessionPay.findMany({
            where: teacherId ? { teacherId } : undefined,
            skip,
            take: limit,
            orderBy: { sessionDate: 'desc' },
            select: {
                id: true,
                teacherId: true,
                branchId: true,
                sessionDate: true,
                sessionCount: true,
                amount: true,
                bonus: true,
                teacher: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
        });
    }
    async createPayrollAdjustment(data) {
        return this.prisma.payrollAdjustment.create({
            data: {
                teacherId: data.teacherId,
                branchId: data.branchId,
                periodYear: data.periodYear,
                periodMonth: data.periodMonth,
                type: data.type,
                amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
                status: data.status,
                note: data.note,
                payrollRunId: data.payrollRunId,
            },
        });
    }
    async listPayrollAdjustments(teacherId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return this.prisma.payrollAdjustment.findMany({
            where: teacherId ? { teacherId } : undefined,
            skip,
            take: limit,
            orderBy: { id: 'desc' },
            select: {
                id: true,
                teacherId: true,
                branchId: true,
                periodYear: true,
                periodMonth: true,
                type: true,
                amount: true,
                status: true,
                note: true,
                teacher: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
        });
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map