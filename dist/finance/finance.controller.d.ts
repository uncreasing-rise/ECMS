import { FinanceService } from './finance.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    listPayrollRuns(branchId?: string, query?: PaginationQueryDto): Promise<{
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
    listSessionPays(teacherId?: string, query?: PaginationQueryDto): Promise<{
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
    listPayrollAdjustments(teacherId?: string, query?: PaginationQueryDto): Promise<{
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
