import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    listPayrollRuns(branchId?: string): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        runByUser: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            id: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            branchId: string | null;
            accountType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        } | null;
    } & {
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
    })[]>;
    createPayrollRun(data: any): Promise<{
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
    listSessionPays(teacherId?: string): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            id: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            branchId: string | null;
            accountType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
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
    createSessionPay(data: any): Promise<{
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
    listPayrollAdjustments(teacherId?: string): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            id: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            branchId: string | null;
            accountType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
    } & {
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
    })[]>;
    createPayrollAdjustment(data: any): Promise<{
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
}
