import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

describe('InvoicesController', () => {
  let controller: InvoicesController;

  const mockInvoicesService = {
    getStudentDebts: jest.fn<InvoicesService['getStudentDebts']>(),
    getDebtDashboard: jest.fn<InvoicesService['getDebtDashboard']>(),
    getRevenueReport: jest.fn<InvoicesService['getRevenueReport']>(),
    getTransactionHistory: jest.fn<InvoicesService['getTransactionHistory']>(),
    exportTransactionHistory:
      jest.fn<InvoicesService['exportTransactionHistory']>(),
    recordPayment: jest.fn<InvoicesService['recordPayment']>(),
    createRefund: jest.fn<InvoicesService['createRefund']>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyDebts', () => {
    it('FR-ECM-022: should return student debts', async () => {
      const studentId = 'student-1';
      const mockDebts = {
        total_debt: 1000,
        overdue_debt: 500,
        invoice_count: 2,
        invoices: [],
      };

      mockInvoicesService.getStudentDebts.mockResolvedValue(mockDebts);

      const result = await controller.getMyDebts({ user: { id: studentId } });

      expect(result).toEqual(mockDebts);
      expect(mockInvoicesService.getStudentDebts).toHaveBeenCalledWith(
        studentId,
      );
    });
  });

  describe('getDebtDashboard', () => {
    it('FR-ECM-022: should return debt dashboard with filters', async () => {
      const mockDashboard = [
        {
          student_id: 'student-1',
          student_name: 'John Doe',
          total_owing: 1000,
          invoice_count: 2,
          invoices: [],
        },
      ];

      mockInvoicesService.getDebtDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getDebtDashboard(
        'student-1',
        5,
        2024,
        'pending',
      );

      expect(result).toEqual(mockDashboard);
      expect(mockInvoicesService.getDebtDashboard).toHaveBeenCalledWith({
        student_id: 'student-1',
        month: 5,
        year: 2024,
        status: 'pending',
      });
    });
  });

  describe('getRevenueReport', () => {
    it('FR-ECM-024: should return revenue report by period', async () => {
      const mockReport = {
        total_revenue: 5000,
        period: 'month' as const,
        from_date: new Date('2024-01-01'),
        to_date: new Date('2024-12-31'),
        data: [],
      };

      mockInvoicesService.getRevenueReport.mockResolvedValue(mockReport);

      const result = await controller.getRevenueReport(
        'month',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'class-1',
      );

      expect(result).toEqual(mockReport);
      expect(mockInvoicesService.getRevenueReport).toHaveBeenCalled();
    });

  });

  describe('getTransactions', () => {
    it('FR-ECM-025: should return transaction history with filters', async () => {
      const mockTransactions = {
        total: 1,
        limit: 50,
        offset: 0,
        data: [
          {
            id: 'payment-1',
            amount: 500,
            method: 'cash',
            paid_at: new Date(),
            note: 'Test payment',
            student_name: 'John Doe',
            class_name: 'Class A',
            course_name: 'English 101',
            created_by: 'Admin',
          },
        ],
      };

      mockInvoicesService.getTransactionHistory.mockResolvedValue(
        mockTransactions,
      );

      const result = await controller.getTransactions(
        'student-1',
        'invoice-1',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'cash',
        50,
        0,
      );

      expect(result).toEqual(mockTransactions);
      expect(mockInvoicesService.getTransactionHistory).toHaveBeenCalledWith({
        student_id: 'student-1',
        invoice_id: 'invoice-1',
        from_date: new Date('2024-01-01'),
        to_date: new Date('2024-12-31'),
        method: 'cash',
        limit: 50,
        offset: 0,
      });
    });
  });

  describe('recordPayment', () => {
    it('FR-ECM-025: should record a payment', async () => {
      const dto: CreatePaymentDto = {
        invoice_id: 'invoice-1',
        amount: 500,
        method: 'cash',
        note: 'Test payment',
      };

      const mockPayment = {
        id: 'payment-1',
        ...dto,
        paid_at: new Date(),
        created_by: 'user-1',
      };

      mockInvoicesService.recordPayment.mockResolvedValue(mockPayment);

      const result = await controller.recordPayment(dto, {
        user: { id: 'user-1' },
      });

      expect(result).toEqual(mockPayment);
      expect(mockInvoicesService.recordPayment).toHaveBeenCalledWith(
        dto,
        'user-1',
      );
    });
  });

  describe('createRefund', () => {
    it('FR-ECM-026: should create refund with audit log', async () => {
      const dto: CreateRefundDto = {
        invoice_id: 'invoice-1',
        amount: 100,
        reason: 'student_request',
        note: 'Student requested refund',
      };

      const mockRefund = {
        id: 'payment-2',
        invoice_id: 'invoice-1',
        amount: -100,
        method: 'refund',
        paid_at: new Date(),
        note: '[student_request] Student requested refund',
        created_by: 'user-1',
      };

      mockInvoicesService.createRefund.mockResolvedValue(mockRefund);

      const result = await controller.createRefund(dto, {
        user: { id: 'user-1' },
      });

      expect(result).toEqual(mockRefund);
      expect(mockInvoicesService.createRefund).toHaveBeenCalledWith(
        dto,
        'user-1',
      );
    });
  });
});
