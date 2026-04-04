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
        branchId: string;
        status: string;
        periodYear: number;
        periodMonth: number;
        totalTeachers: number;
        grossAmount: import("@prisma/client-runtime-utils").Decimal;
        netAmount: import("@prisma/client-runtime-utils").Decimal;
        runAt: Date;
        runBy: string | null;
    }>;
    listPayrollRuns(branchId?: string, page?: number, limit?: number): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
        };
        id: string;
        branchId: string;
        status: string;
        periodYear: number;
        periodMonth: number;
        totalTeachers: number;
        grossAmount: import("@prisma/client-runtime-utils").Decimal;
        netAmount: import("@prisma/client-runtime-utils").Decimal;
        runAt: Date;
        runByUser: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        } | null;
    }[]>;
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
    listSessionPays(teacherId?: string, page?: number, limit?: number): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
        };
        id: string;
        branchId: string;
        teacherId: string;
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        sessionDate: Date;
        sessionCount: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bonus: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
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
        branchId: string;
        status: string;
        teacherId: string;
        periodYear: number;
        periodMonth: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string | null;
        type: string;
        note: string | null;
    }>;
    listPayrollAdjustments(teacherId?: string, page?: number, limit?: number): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
        };
        id: string;
        branchId: string;
        status: string;
        teacherId: string;
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        periodYear: number;
        periodMonth: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        type: string;
        note: string | null;
    }[]>;
}
