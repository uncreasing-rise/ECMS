import { PrismaService } from '../prisma/prisma.service';
export declare class FinanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPayrollRun(data: {
        branchId: string;
        periodYear: number;
        periodMonth: number;
        totalTeachers: number;
        grossAmount: number | string;
        netAmount: number | string;
        status: string;
        runBy?: string;
    }): Promise<{
        id: string;
        status: string;
        branchId: string;
        periodYear: number;
        periodMonth: number;
        totalTeachers: number;
        grossAmount: import("@prisma/client-runtime-utils").Decimal;
        netAmount: import("@prisma/client-runtime-utils").Decimal;
        runAt: Date;
        runBy: string | null;
    }>;
    listPayrollRuns(branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        runByUser: {
            id: string;
            status: string;
            email: string;
            firstName: string;
            lastName: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            phone: string | null;
            branchId: string | null;
            accountType: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        } | null;
    } & {
        id: string;
        status: string;
        branchId: string;
        periodYear: number;
        periodMonth: number;
        totalTeachers: number;
        grossAmount: import("@prisma/client-runtime-utils").Decimal;
        netAmount: import("@prisma/client-runtime-utils").Decimal;
        runAt: Date;
        runBy: string | null;
    })[]>;
    createSessionPay(data: {
        teacherId: string;
        branchId: string;
        sessionDate: Date;
        sessionCount: number;
        amount: number | string;
        bonus?: number | string;
        payrollRunId?: string;
    }): Promise<{
        id: string;
        branchId: string;
        teacherId: string;
        classId: string | null;
        sessionDate: Date;
        sessionCount: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bonus: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string | null;
    }>;
    listSessionPays(teacherId?: string): Promise<({
        teacher: {
            id: string;
            status: string;
            email: string;
            firstName: string;
            lastName: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            phone: string | null;
            branchId: string | null;
            accountType: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
    } & {
        id: string;
        branchId: string;
        teacherId: string;
        classId: string | null;
        sessionDate: Date;
        sessionCount: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bonus: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string | null;
    })[]>;
    createPayrollAdjustment(data: {
        teacherId: string;
        branchId: string;
        periodYear: number;
        periodMonth: number;
        type: string;
        amount: number | string;
        status: string;
        note?: string;
        payrollRunId?: string;
    }): Promise<{
        id: string;
        status: string;
        branchId: string;
        teacherId: string;
        periodYear: number;
        periodMonth: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string | null;
        type: string;
        note: string | null;
    }>;
    listPayrollAdjustments(teacherId?: string): Promise<({
        teacher: {
            id: string;
            status: string;
            email: string;
            firstName: string;
            lastName: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            phone: string | null;
            branchId: string | null;
            accountType: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
    } & {
        id: string;
        status: string;
        branchId: string;
        teacherId: string;
        periodYear: number;
        periodMonth: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string | null;
        type: string;
        note: string | null;
    })[]>;
}
