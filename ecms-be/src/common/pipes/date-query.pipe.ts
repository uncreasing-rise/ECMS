import { AppErrorCode } from '../api/app-error-code.enum.js';
import { AppException } from '../api/app-exception.js';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class OptionalDatePipe implements PipeTransform<
  string | undefined,
  Date | undefined
> {
  constructor(private readonly fieldName = 'date') {}

  transform(value: string | undefined): Date | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'error.bad_request',
        message: `${this.fieldName} không hợp lệ`,
      });
    }

    return parsed;
  }
}

@Injectable()
export class RequiredDatePipe implements PipeTransform<
  string | undefined,
  Date
> {
  constructor(private readonly fieldName = 'date') {}

  transform(value: string | undefined): Date {
    if (value === undefined || value === null || value === '') {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'error.bad_request',
        message: `${this.fieldName} là bắt buộc`,
      });
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'error.bad_request',
        message: `${this.fieldName} không hợp lệ`,
      });
    }

    return parsed;
  }
}
