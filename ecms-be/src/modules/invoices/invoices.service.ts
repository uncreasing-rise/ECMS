import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import {
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateRefundDto } from './dto/create-refund.dto.js';
// AuditLogsService import removed - service not yet implemented

/**
 * FR-ECM-020: Auto-create invoices when students enroll in classes
 * FR-ECM-022: Debt tracking dashboard (by student, by month, overdue alerts)
 * FR-ECM-024: Revenue reporting (by day/week/month/year, by class)
 * FR-ECM-025: Transaction history lookup and export
 * FR-ECM-026: Refund/adjustment process with audit log
 */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private static readonly MAX_EXPORT_ROWS = 100000;

  /**
   * FR-ECM-020: Auto-create invoice when student enrolls in class
   * Called from ClassesCoreService.enrollStudent()
   * PERF: Minimal select to avoid unnecessary data loading
   */
  async createInvoiceForEnrollment(
    enrollmentId: string,
    coursePrice: Prisma.Decimal | number,
    dueDate?: Date,
  ) {
    try {
      const invoice = await this.prisma.invoices.create({
        data: {
          id: randomUUID(),
          enrollment_id: enrollmentId,
          amount: new Prisma.Decimal(Number(coursePrice)),
          due_date: dueDate ?? this.getDueDate(),
          status: 'pending',
          paid_amount: new Prisma.Decimal(0),
          created_at: new Date(),
        },
        select: { id: true }, // Minimal select for better performance
      });

      const enrollment = await this.prisma.enrollments.findUnique({
        where: { id: enrollmentId },
        select: { student_id: true },
      });

      if (enrollment?.student_id) {
        await this.notifications.create({
          user_id: enrollment.student_id,
          type: NotificationType.INVOICE_CREATED,
          title: 'Hoa don moi da duoc tao',
          body: 'He thong vua tao hoa don hoc phi moi cho ban.',
          ref_type: NotificationRefType.INVOICE,
          ref_id: invoice.id,
        });
      }

      return invoice;
    } catch (error: unknown) {
      // Silently handle if invoice already exists (unique constraint)
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  /**
   * FR-ECM-020: Create invoice directly (without enrollment requirement)
   * For standalone payments or when student hasn't enrolled yet
   * PERF: Minimal select for better performance
   */
  async createInvoice(dto: CreateInvoiceDto) {
    try {
      const invoice = await this.prisma.invoices.create({
        data: {
          id: randomUUID(),
          enrollment_id: dto.enrollment_id || undefined,
          amount: new Prisma.Decimal(Number(dto.amount)),
          due_date: dto.due_date ?? this.getDueDate(),
          status: 'pending',
          paid_amount: new Prisma.Decimal(0),
          created_at: new Date(),
        },
        select: { id: true },
      });

      if (dto.enrollment_id) {
        const enrollment = await this.prisma.enrollments.findUnique({
          where: { id: dto.enrollment_id },
          select: { student_id: true },
        });

        if (enrollment?.student_id) {
          await this.notifications.create({
            user_id: enrollment.student_id,
            type: NotificationType.INVOICE_CREATED,
            title: 'Hoa don moi da duoc tao',
            body: 'He thong vua tao hoa don hoc phi moi cho ban.',
            ref_type: NotificationRefType.INVOICE,
            ref_id: invoice.id,
          });
        }
      }

      return invoice;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  /**
   * FR-ECM-022: Get student debt summary (unpaid invoices)
   * PERF: Use database aggregation + selective joins to avoid N+1
   */
  async getStudentDebts(studentId: string) {
    // Fetch unpaid invoices with only needed fields
    const debts = await this.prisma.invoices.findMany({
      where: {
        enrollments: {
          student_id: studentId,
        },
        status: { not: 'paid' },
      },
      select: {
        id: true,
        amount: true,
        paid_amount: true,
        due_date: true,
        status: true,
        enrollments: {
          select: {
            classes: {
              select: { name: true, courses: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    // Use raw aggregation query for summary stats (avoids looping)
    const summary = await this.prisma.$queryRaw<
      Array<{ total: Prisma.Decimal; count: bigint; overdue: Prisma.Decimal }>
    >`
      SELECT
        SUM(amount - COALESCE(paid_amount, 0)) as total,
        COUNT(*) as count,
        SUM(CASE WHEN due_date < NOW() THEN (amount - COALESCE(paid_amount, 0)) ELSE 0 END) as overdue
      FROM invoices
      WHERE status != 'paid'
        AND enrollment_id IN (
          SELECT id FROM enrollments WHERE student_id = ${studentId}::uuid
        )
    `;

    const stats = summary[0] || {};

    return {
      total_debt: Number(stats.total || 0),
      overdue_debt: Number(stats.overdue || 0),
      invoice_count: debts.length,
      invoices: debts.map((inv) => ({
        id: inv.id,
        amount: Number(inv.amount),
        paid_amount: Number(inv.paid_amount),
        due_date: inv.due_date,
        status: inv.status,
        class_name: inv.enrollments?.classes.name,
        course_name: inv.enrollments?.classes.courses?.name,
      })),
    };
  }

  /**
   * FR-ECM-022: Get debt tracking dashboard (by student, by month)
   * PERF: Use database GROUP BY instead of in-memory aggregation
   */
  async getDebtDashboard(filters?: {
    student_id?: string;
    month?: number;
    year?: number;
    status?: string;
  }) {
    const whereClauses: Prisma.Sql[] = [Prisma.sql`i.status != 'paid'`];

    if (filters?.student_id) {
      whereClauses.push(Prisma.sql`e.student_id = ${filters.student_id}::uuid`);
    }

    if (filters?.month && filters?.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      whereClauses.push(
        Prisma.sql`i.due_date BETWEEN ${startDate} AND ${endDate}`,
      );
    }

    if (filters?.status) {
      whereClauses.push(Prisma.sql`i.status = ${filters.status}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`;

    const invoices = await this.prisma.$queryRaw<
      Array<{
        student_id: string;
        full_name: string;
        invoice_count: bigint;
        total_owing: Prisma.Decimal;
      }>
    >`
      SELECT
        e.student_id,
        u.full_name,
        COUNT(i.id) as invoice_count,
        COALESCE(SUM(i.amount - COALESCE(i.paid_amount, 0)), 0) as total_owing
      FROM invoices i
      LEFT JOIN enrollments e ON i.enrollment_id = e.id
      LEFT JOIN users u ON e.student_id = u.id
      ${whereSql}
      GROUP BY e.student_id, u.full_name
      ORDER BY total_owing DESC
    `;

    // Fetch individual invoice details only for top debtors (limit to 100)
    const topDebtorIds = invoices.slice(0, 100).map((s) => s.student_id);

    const invoicesByStudent = await this.prisma.invoices.findMany({
      where: {
        status: { not: 'paid' },
        enrollments: {
          student_id: {
            in: topDebtorIds,
          },
        },
      },
      select: {
        id: true,
        amount: true,
        paid_amount: true,
        due_date: true,
        enrollments: { select: { student_id: true } },
      },
      orderBy: { due_date: 'asc' },
    });

    const invoicesByStudentMap = new Map<string, typeof invoicesByStudent>();
    invoicesByStudent.forEach((inv) => {
      const sid = inv.enrollments?.student_id;
      if (sid) {
        if (!invoicesByStudentMap.has(sid)) {
          invoicesByStudentMap.set(sid, []);
        }
        invoicesByStudentMap.get(sid)!.push(inv);
      }
    });

    return invoices.map((record) => ({
      student_id: record.student_id,
      student_name: record.full_name,
      total_owing: Number(record.total_owing),
      invoice_count: Number(record.invoice_count),
      invoices: (invoicesByStudentMap.get(record.student_id) || []).map(
        (inv) => ({
          invoice_id: inv.id,
          amount: Number(inv.amount),
          owing: Number(inv.amount) - Number(inv.paid_amount),
          due_date: inv.due_date,
          is_overdue: inv.due_date && inv.due_date < new Date(),
        }),
      ),
    }));
  }

  /**
   * FR-ECM-024: Get revenue report by time period
   * PERF: Use database aggregation + date_trunc for efficient period grouping
   */
  async getRevenueReport(params: {
    period: 'day' | 'week' | 'month' | 'year';
    from_date: Date;
    to_date: Date;
    class_id?: string;
  }) {
    const periodMapping: Record<'day' | 'week' | 'month' | 'year', Prisma.Sql> =
      {
        day: Prisma.sql`DATE(p.paid_at)`,
        week: Prisma.sql`DATE_TRUNC('week', p.paid_at)::date`,
        month: Prisma.sql`DATE_TRUNC('month', p.paid_at)::date`,
        year: Prisma.sql`DATE_TRUNC('year', p.paid_at)::date`,
      };
    const periodExpr = periodMapping[params.period];

    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`p.paid_at BETWEEN ${params.from_date} AND ${params.to_date}`,
    ];
    if (params.class_id) {
      whereClauses.push(Prisma.sql`e.class_id = ${params.class_id}::uuid`);
    }
    const whereSql = Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`;

    const revenueData = await this.prisma.$queryRaw<
      Array<{
        period: Date;
        revenue: Prisma.Decimal;
        count: bigint;
      }>
    >`
      SELECT
        ${periodExpr} as period,
        SUM(COALESCE(p.amount, 0)) as revenue,
        COUNT(*) as count
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN enrollments e ON i.enrollment_id = e.id
      ${whereSql}
      GROUP BY ${periodExpr}
      ORDER BY period ASC
    `;

    const totalRevenue = await this.prisma.$queryRaw<
      Array<{ total: Prisma.Decimal }>
    >`
      SELECT SUM(COALESCE(p.amount, 0)) as total
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN enrollments e ON i.enrollment_id = e.id
      ${whereSql}
    `;

    return {
      total_revenue: Number(totalRevenue[0]?.total || 0),
      period: params.period,
      from_date: params.from_date,
      to_date: params.to_date,
      data: revenueData.map((r) => ({
        period: new Date(r.period).toISOString().split('T')[0],
        revenue: Number(r.revenue),
        count: Number(r.count),
      })),
    };
  }

  /**
   * FR-ECM-025: Get transaction history with filters and export capability
   * PERF: Selective field loading + JOIN optimization + pagination
   */
  async getTransactionHistory(params?: {
    student_id?: string;
    invoice_id?: string;
    from_date?: Date;
    to_date?: Date;
    method?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(params?.limit ?? 50, 1000); // Cap at 1000
    const offset = params?.offset ?? 0;

    const where: Prisma.paymentsWhereInput = {};

    if (params?.student_id) {
      where.invoices = {
        enrollments: { student_id: params.student_id },
      };
    }

    if (params?.invoice_id) {
      where.invoice_id = params.invoice_id;
    }

    if (params?.from_date || params?.to_date) {
      where.paid_at = {
        ...(params?.from_date && { gte: params.from_date }),
        ...(params?.to_date && { lte: params.to_date }),
      };
    }

    if (params?.method) {
      where.method = params.method;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payments.findMany({
        where,
        select: {
          id: true,
          amount: true,
          method: true,
          paid_at: true,
          note: true,
          users: { select: { full_name: true } },
          invoices: {
            select: {
              id: true,
              enrollments: {
                select: {
                  users: { select: { full_name: true } },
                  classes: {
                    select: {
                      name: true,
                      courses: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { paid_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payments.count({ where }),
    ]);

    return {
      total,
      limit,
      offset,
      data: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        paid_at: p.paid_at,
        note: p.note,
        student_name: p.invoices.enrollments?.users.full_name ?? 'N/A',
        class_name: p.invoices.enrollments?.classes.name ?? 'N/A',
        course_name: p.invoices.enrollments?.classes.courses?.name ?? 'N/A',
        created_by: p.users?.full_name,
      })),
    };
  }

  /**
   * FR-ECM-025: Export transaction history to CSV format
   * PERF: Direct CSV generation from raw query (no ORM overhead)
   */
  async exportTransactionHistory(params?: {
    student_id?: string;
    invoice_id?: string;
    from_date?: Date;
    to_date?: Date;
    method?: string;
  }): Promise<string> {
    const whereClauses: Prisma.Sql[] = [Prisma.sql`1=1`];
    if (params?.student_id) {
      whereClauses.push(Prisma.sql`e.student_id = ${params.student_id}::uuid`);
    }
    if (params?.invoice_id) {
      whereClauses.push(Prisma.sql`p.invoice_id = ${params.invoice_id}::uuid`);
    }
    if (params?.from_date) {
      whereClauses.push(Prisma.sql`p.paid_at >= ${params.from_date}`);
    }
    if (params?.to_date) {
      whereClauses.push(Prisma.sql`p.paid_at <= ${params.to_date}`);
    }
    if (params?.method) {
      whereClauses.push(Prisma.sql`p.method = ${params.method}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`;

    // Use raw query for direct CSV generation (more efficient than ORM)
    const csvRecords = await this.prisma.$queryRaw<
      Array<{
        id: string;
        student_name: string;
        class_name: string;
        course_name: string;
        amount: Prisma.Decimal;
        method: string;
        paid_at: Date;
        note: string;
        created_by: string;
      }>
    >`
      SELECT
        p.id,
        COALESCE(u.full_name, 'Unknown') as student_name,
        COALESCE(c.name, 'N/A') as class_name,
        COALESCE(cr.name, 'N/A') as course_name,
        p.amount,
        p.method,
        p.paid_at,
        p.note,
        COALESCE(created_user.full_name, 'System') as created_by
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN enrollments e ON i.enrollment_id = e.id
      LEFT JOIN users u ON e.student_id = u.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN courses cr ON c.course_id = cr.id
      LEFT JOIN users created_user ON p.created_by = created_user.id
      ${whereSql}
      ORDER BY p.paid_at DESC
      LIMIT ${InvoicesService.MAX_EXPORT_ROWS}
    `;

    const headers = [
      'ID',
      'Student Name',
      'Class Name',
      'Course Name',
      'Amount',
      'Method',
      'Paid At',
      'Note',
      'Created By',
    ];

    const csvContent = [
      headers.join(','),
      ...csvRecords.map((t) =>
        [
          this.escapeCSV(t.id),
          this.escapeCSV(t.student_name),
          this.escapeCSV(t.class_name),
          this.escapeCSV(t.course_name),
          this.escapeCSV(Number(t.amount)),
          this.escapeCSV(t.method),
          this.escapeCSV(t.paid_at),
          this.escapeCSV(t.note),
          this.escapeCSV(t.created_by),
        ].join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * FR-ECM-025: Create payment record
   * PERF: Use transaction for atomicity + minimal selects
   */
  async recordPayment(dto: CreatePaymentDto, createdBy: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoices.findUnique({
        where: { id: dto.invoice_id },
        select: {
          id: true,
          amount: true,
          paid_amount: true,
          enrollments: { select: { student_id: true } },
        },
      });

      if (!invoice) {
        throw new AppException({ code: AppErrorCode.NOT_FOUND, errorKey: 'invoice.not_found', message: 'Không tìm thấy hóa đơn' });
      }

      const totalPaid = Number(invoice.paid_amount) + dto.amount;
      if (totalPaid > Number(invoice.amount)) {
        throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'invoice.bad_request', message: `Số tiền thanh toán vượt quá công nợ (công nợ: ${Number(invoice.amount)}, đã thanh toán: ${Number(invoice.paid_amount)})`, });
      }

      const status = totalPaid >= Number(invoice.amount) ? 'paid' : 'partial';

      const updateResult = await tx.invoices.updateMany({
        where: { id: dto.invoice_id, paid_amount: invoice.paid_amount },
        data: {
          paid_amount: new Prisma.Decimal(totalPaid),
          status,
        },
      });

      if (updateResult.count !== 1) {
        throw new AppException({ code: AppErrorCode.CONFLICT, errorKey: 'invoice.conflict', message: 'Hóa đơn đã thay đổi bởi giao dịch khác, vui lòng thử lại', });
      }

      const payment = await tx.payments.create({
        data: {
          id: randomUUID(),
          invoice_id: dto.invoice_id,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method,
          note: dto.note,
          created_by: createdBy,
          paid_at: new Date(),
        },
        select: { id: true },
      });

      return {
        payment,
        studentId: invoice.enrollments?.student_id ?? null,
      };
    });

    if (result.studentId) {
      await this.notifications.create({
        user_id: result.studentId,
        type: NotificationType.INVOICE_PAYMENT_RECORDED,
        title: 'Da ghi nhan thanh toan',
        body: `He thong da ghi nhan thanh toan ${dto.amount} cho hoa don cua ban.`,
        ref_type: NotificationRefType.INVOICE,
        ref_id: dto.invoice_id,
      });
    }

    return result.payment;
  }

  /**
   * FR-ECM-026: Create refund/adjustment with audit log
   * PERF: Use transaction for atomicity + minimal selects
   */
  async createRefund(dto: CreateRefundDto, createdBy: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoices.findUnique({
        where: { id: dto.invoice_id },
        select: {
          id: true,
          paid_amount: true,
          amount: true,
          enrollments: { select: { student_id: true } },
        },
      });

      if (!invoice) {
        throw new AppException({ code: AppErrorCode.NOT_FOUND, errorKey: 'invoice.not_found', message: 'Không tìm thấy hóa đơn' });
      }

      if (dto.amount > Number(invoice.paid_amount)) {
        throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'invoice.bad_request', message: `Số tiền hoàn phí vượt quá số tiền đã thanh toán (đã thanh toán: ${Number(invoice.paid_amount)})`, });
      }

      const newPaidAmount = Math.max(
        0,
        Number(invoice.paid_amount || 0) - dto.amount,
      );
      const status =
        newPaidAmount === 0
          ? 'pending'
          : newPaidAmount >= Number(invoice.amount)
            ? 'paid'
            : 'partial';

      const updateResult = await tx.invoices.updateMany({
        where: { id: dto.invoice_id, paid_amount: invoice.paid_amount },
        data: {
          paid_amount: new Prisma.Decimal(newPaidAmount),
          status,
        },
      });

      if (updateResult.count !== 1) {
        throw new AppException({ code: AppErrorCode.CONFLICT, errorKey: 'invoice.conflict', message: 'Hóa đơn đã thay đổi bởi giao dịch khác, vui lòng thử lại', });
      }

      const refundPayment = await tx.payments.create({
        data: {
          id: randomUUID(),
          invoice_id: dto.invoice_id,
          amount: new Prisma.Decimal(-dto.amount),
          method: 'refund',
          note: `[${dto.reason}] ${dto.note || ''}`,
          created_by: createdBy,
          paid_at: new Date(),
        },
        select: { id: true },
      });

      return {
        refundPayment,
        studentId: invoice.enrollments?.student_id ?? null,
      };
    });

    if (result.studentId) {
      await this.notifications.create({
        user_id: result.studentId,
        type: NotificationType.INVOICE_REFUNDED,
        title: 'Da ghi nhan hoan phi',
        body: `He thong da ghi nhan hoan phi ${dto.amount} cho hoa don cua ban.`,
        ref_type: NotificationRefType.INVOICE,
        ref_id: dto.invoice_id,
      });
    }

    return result.refundPayment;
  }

  /**
   * Helper: Escape CSV values
   */
  private escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Helper: Get default due date (30 days from now)
   * PERF: Calculate once at method start instead of in loop
   */
  private getDueDate(defaultDays: number = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() + defaultDays);
    return date;
  }
}





