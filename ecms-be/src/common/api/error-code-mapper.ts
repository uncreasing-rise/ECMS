import { HttpStatus } from '@nestjs/common';
import { AppErrorCode } from './app-error-code.enum.js';

export function mapStatusToErrorCode(status: number): AppErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return AppErrorCode.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return AppErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return AppErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return AppErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return AppErrorCode.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return AppErrorCode.TOO_MANY_REQUESTS;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return AppErrorCode.SERVICE_UNAVAILABLE;
    default:
      if (status >= 500) {
        return AppErrorCode.INTERNAL_SERVER_ERROR;
      }
      return AppErrorCode.UNKNOWN_ERROR;
  }
}

export function mapStatusToErrorKey(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'error.bad_request';
    case HttpStatus.UNAUTHORIZED:
      return 'error.unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'error.forbidden';
    case HttpStatus.NOT_FOUND:
      return 'error.not_found';
    case HttpStatus.CONFLICT:
      return 'error.conflict';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'error.too_many_requests';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'error.service_unavailable';
    default:
      if (status >= 500) {
        return 'error.internal_server';
      }
      return 'error.unknown';
  }
}
