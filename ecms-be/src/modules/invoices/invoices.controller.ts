import {
  Controller,
  Get,
  Post,
  Request,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  OptionalDatePipe,
  RequiredDatePipe,
} from '../../common/pipes/date-query.pipe.js';
import { InvoicesService } from './invoices.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateRefundDto } from './dto/create-refund.dto.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';

/**
 * FR-ECM-020: Auto-create invoices for student enrollments
 * FR-ECM-022: Debt tracking dashboard
 * FR-ECM-024: Revenue reporting
 * FR-ECM-025: Transaction history and export
 * FR-ECM-026: Refund/adjustment process
 */
@Controller('invoices')
@UseGuards(AuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  private getUserId(req: { user: { id: string } }): string {
    return req.user.id;
  }

  /**
   * FR-ECM-022: Get current user's debt summary
   * GET /invoices/my-debts
   */
  @Get('my-debts')
  async getMyDebts(@Request() req: { user: { id: string } }) {
    return this.invoicesService.getStudentDebts(this.getUserId(req));
  }

  /**
   * FR-ECM-022: Get debt tracking dashboard
   * GET /invoices/debt-dashboard
   * Query: ?student_id=xxx&month=5&year=2024&status=pending
   */
  @Get('debt-dashboard')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async getDebtDashboard(
    @Query('student_id') studentId?: string,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.getDebtDashboard({
      student_id: studentId,
      month,
      year,
      status,
    });
  }

  /**
   * FR-ECM-024: Get revenue report by period
   * GET /invoices/revenue-report
   * Query: ?period=month&from_date=2024-01-01&to_date=2024-12-31&class_id=xxx
   */
  @Get('revenue-report')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async getRevenueReport(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month',
    @Query('from_date', new RequiredDatePipe('from_date')) fromDate: Date,
    @Query('to_date', new RequiredDatePipe('to_date')) toDate: Date,
    @Query('class_id') classId?: string,
  ) {
    return this.invoicesService.getRevenueReport({
      period,
      from_date: fromDate,
      to_date: toDate,
      class_id: classId,
    });
  }

  /**
   * FR-ECM-025: Get transaction history
   * GET /invoices/transactions
   * Query: ?student_id=xxx&invoice_id=xxx&method=cash&limit=50&offset=0
   */
  @Get('transactions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async getTransactions(
    @Query('student_id') studentId?: string,
    @Query('invoice_id') invoiceId?: string,
    @Query('from_date', new OptionalDatePipe('from_date')) fromDate?: Date,
    @Query('to_date', new OptionalDatePipe('to_date')) toDate?: Date,
    @Query('method') method?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.invoicesService.getTransactionHistory({
      student_id: studentId,
      invoice_id: invoiceId,
      from_date: fromDate,
      to_date: toDate,
      method,
      limit,
      offset,
    });
  }

  /**
   * FR-ECM-025: Export transaction history to CSV
   * GET /invoices/transactions/export
   */
  @Get('transactions/export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async exportTransactions(
    @Res() res: Response,
    @Query('student_id') studentId: string = '',
    @Query('invoice_id') invoiceId: string = '',
    @Query('from_date', new OptionalDatePipe('from_date'))
    fromDate?: Date,
    @Query('to_date', new OptionalDatePipe('to_date'))
    toDate?: Date,
    @Query('method') method: string = '',
  ) {
    const csv = await this.invoicesService.exportTransactionHistory({
      student_id: studentId || undefined,
      invoice_id: invoiceId || undefined,
      from_date: fromDate,
      to_date: toDate,
      method: method || undefined,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transactions_${new Date().getTime()}.csv"`,
    );
    res.send(csv);
  }

  /**
   * FR-ECM-020: Create invoice directly (without enrollment)
   * POST /invoices
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(dto);
  }

  /**
   * FR-ECM-025: Record a payment
   * POST /invoices/payments
   */
  @Post('payments')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async recordPayment(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.invoicesService.recordPayment(dto, this.getUserId(req));
  }

  /**
   * FR-ECM-026: Process refund or adjustment
   * POST /invoices/refunds
   */
  @Post('refunds')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  async createRefund(
    @Body() dto: CreateRefundDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.invoicesService.createRefund(dto, this.getUserId(req));
  }
}
