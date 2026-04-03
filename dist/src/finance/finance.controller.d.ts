import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
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
    createPayrollRun(data: any): Promise<{
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
    createPayrollAdjustment(data: any): Promise<{
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
}
