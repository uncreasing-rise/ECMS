import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
	constructor(private readonly prisma: PrismaService) {}

	// Payroll Run operations
	async createPayrollRun(data: {
		branchId: string;
		periodYear: number;
		periodMonth: number;
		totalTeachers: number;
		grossAmount: number | string;
		netAmount: number | string;
		status: string;
		runBy?: string;
	}) {
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

	async listPayrollRuns(branchId?: string, page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		return this.prisma.payrollRun.findMany({
			where: branchId ? { branchId } : undefined,
			skip,
			take: limit,
			orderBy: { runAt: 'desc' },
			include: { branch: true, runByUser: true },
		});
	}

	// Session Pay operations
	async createSessionPay(data: {
		teacherId: string;
		branchId: string;
		sessionDate: Date;
		sessionCount: number;
		amount: number | string;
		bonus?: number | string;
		payrollRunId?: string;
	}) {
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

	async listSessionPays(teacherId?: string, page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		return this.prisma.sessionPay.findMany({
			where: teacherId ? { teacherId } : undefined,
			skip,
			take: limit,
			orderBy: { sessionDate: 'desc' },
			include: { teacher: true, branch: true },
		});
	}

	// Payroll Adjustment operations
	async createPayrollAdjustment(data: {
		teacherId: string;
		branchId: string;
		periodYear: number;
		periodMonth: number;
		type: string;
		amount: number | string;
		status: string;
		note?: string;
		payrollRunId?: string;
	}) {
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

	async listPayrollAdjustments(teacherId?: string, page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		return this.prisma.payrollAdjustment.findMany({
			where: teacherId ? { teacherId } : undefined,
			skip,
			take: limit,
			orderBy: { id: 'desc' },
			include: { teacher: true, branch: true },
		});
	}
}
