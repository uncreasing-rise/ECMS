import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { Request } from 'express';
import { AppErrorCode } from './app-error-code.enum.js';
import { ApiResponseEnvelope } from './api-response.types.js';
import { resolveLocaleFromHeader, resolveMessage } from './message-catalog.js';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseEnvelope<T>> {
    const req = context.switchToHttp().getRequest<Request>();
    const locale = resolveLocaleFromHeader(this.pickAcceptLanguage(req));

    return next.handle().pipe(
      map((data) => {
        if (this.isApiEnvelope(data)) {
          return data;
        }

        return {
          code: AppErrorCode.SUCCESS,
          message: resolveMessage('success.ok', locale),
          data,
        };
      }),
    );
  }

  private isApiEnvelope(value: unknown): value is ApiResponseEnvelope<T> {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.code === 'string' &&
      typeof candidate.message === 'string' &&
      'data' in candidate
    );
  }

  private pickAcceptLanguage(req?: Request) {
    if (!req) {
      return undefined;
    }

    const header = req.headers['accept-language'];
    if (Array.isArray(header)) {
      return header[0];
    }

    return header;
  }
}
