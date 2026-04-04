import { Body, Controller, Get, Post, UseGuards, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
	constructor(private readonly financeService: FinanceService) {}

	// Payroll Run endpoints
	@Get('payroll-runs')
	listPayrollRuns(
		@Query('branchId') branchId?: string,
		@Query() query?: PaginationQueryDto,
	) {
		return this.financeService.listPayrollRuns(branchId, query?.page, query?.limit);
	}

	@Post('payroll-runs')
	createPayrollRun(@Body() data: any) {
		return this.financeService.createPayrollRun(data);
	}

	// Session Pay endpoints
	@Get('session-pays')
	listSessionPays(
		@Query('teacherId') teacherId?: string,
		@Query() query?: PaginationQueryDto,
	) {
		return this.financeService.listSessionPays(teacherId, query?.page, query?.limit);
	}

	@Post('session-pays')
	createSessionPay(@Body() data: any) {
		return this.financeService.createSessionPay(data);
	}

	// Payroll Adjustment endpoints
	@Get('adjustments')
	listPayrollAdjustments(
		@Query('teacherId') teacherId?: string,
		@Query() query?: PaginationQueryDto,
	) {
		return this.financeService.listPayrollAdjustments(teacherId, query?.page, query?.limit);
	}

	@Post('adjustments')
	createPayrollAdjustment(@Body() data: any) {
		return this.financeService.createPayrollAdjustment(data);
	}
}
