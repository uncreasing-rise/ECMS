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

	async listPayrollRuns(branchId?: string, page = 1, limit = 20, detail = false) {
		const safeLimit = Math.min(Math.max(limit, 1), 50);
		const skip = (page - 1) * safeLimit;

		if (detail) {
			return this.prisma.payrollRun.findMany({
				where: branchId ? { branchId } : undefined,
				skip,
				take: safeLimit,
				orderBy: { runAt: 'desc' },
				include: {
					branch: true,
					runByUser: true,
					sessionPays: {
						select: {
							id: true,
							teacherId: true,
							amount: true,
							bonus: true,
							sessionCount: true,
						},
						take: 100,
					},
					payrollAdjustments: {
						select: {
							id: true,
							teacherId: true,
							type: true,
							amount: true,
							status: true,
						},
						take: 100,
					},
				},
			});
		}

		return this.prisma.payrollRun.findMany({
			where: branchId ? { branchId } : undefined,
			skip,
			take: safeLimit,
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

	async listSessionPays(teacherId?: string, page = 1, limit = 20, detail = false) {
		const safeLimit = Math.min(Math.max(limit, 1), 50);
		const skip = (page - 1) * safeLimit;

		if (detail) {
			return this.prisma.sessionPay.findMany({
				where: teacherId ? { teacherId } : undefined,
				skip,
				take: safeLimit,
				orderBy: { sessionDate: 'desc' },
				include: {
					teacher: true,
					branch: true,
					payrollRun: true,
				},
			});
		}

		return this.prisma.sessionPay.findMany({
			where: teacherId ? { teacherId } : undefined,
			skip,
			take: safeLimit,
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

	async listPayrollAdjustments(teacherId?: string, page = 1, limit = 20, detail = false) {
		const safeLimit = Math.min(Math.max(limit, 1), 50);
		const skip = (page - 1) * safeLimit;

		if (detail) {
			return this.prisma.payrollAdjustment.findMany({
				where: teacherId ? { teacherId } : undefined,
				skip,
				take: safeLimit,
				orderBy: { id: 'desc' },
				include: {
					teacher: true,
					branch: true,
					payrollRun: true,
				},
			});
		}

		return this.prisma.payrollAdjustment.findMany({
			where: teacherId ? { teacherId } : undefined,
			skip,
			take: safeLimit,
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
}
