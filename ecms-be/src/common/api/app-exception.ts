import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode } from './app-error-code.enum.js';

export interface AppExceptionOptions {
  code: AppErrorCode;
  errorKey: string;
  status?: HttpStatus;
  message?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export class AppException extends HttpException {
  constructor(options: AppExceptionOptions) {
    super(
      {
        code: options.code,
        errorKey: options.errorKey,
        message: options.message ?? options.errorKey,
        details: options.details,
        meta: options.meta,
      },
      options.status ?? HttpStatus.BAD_REQUEST,
    );
  }
}
