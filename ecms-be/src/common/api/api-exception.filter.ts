import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiErrorResponse, ApiResponseEnvelope } from './api-response.types.js';
import { mapStatusToErrorCode, mapStatusToErrorKey } from './error-code-mapper.js';
import { resolveLocaleFromHeader, resolveMessage } from './message-catalog.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responsePayload =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const locale = resolveLocaleFromHeader(this.pickAcceptLanguage(request));

    const normalized = this.normalizeException(status, responsePayload, locale);

    const error: ApiErrorResponse = {
      code: normalized.code,
      message: normalized.message,
      errorKey: normalized.errorKey,
      details: normalized.details,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      requestId: this.pickRequestId(request),
    };

    const envelope: ApiResponseEnvelope<null> = {
      code: error.code,
      message: error.message,
      data: null,
      meta: {
        error,
      },
    };

    response.status(status).json(envelope);
  }

  private normalizeException(
    status: number,
    payload: unknown,
    locale: 'vi' | 'en',
  ) {
    const fallbackErrorKey = mapStatusToErrorKey(status);
    const fallbackCode = mapStatusToErrorCode(status);

    if (typeof payload === 'string') {
      return {
        code: fallbackCode,
        errorKey: fallbackErrorKey,
        message: payload,
        details: undefined as unknown,
      };
    }

    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      const code = String(obj.code ?? fallbackCode);
      const errorKey = String(obj.errorKey ?? fallbackErrorKey);
      const messageValue = obj.message;

      if (Array.isArray(messageValue)) {
        return {
          code,
          errorKey: 'error.validation_failed',
          message: resolveMessage('error.validation_failed', locale),
          details: messageValue,
        };
      }

      const message =
        typeof messageValue === 'string'
          ? messageValue.startsWith('error.')
            ? resolveMessage(messageValue, locale)
            : messageValue
          : resolveMessage(errorKey, locale);

      return {
        code,
        errorKey,
        message,
        details: obj.details,
      };
    }

    return {
      code: fallbackCode,
      errorKey: fallbackErrorKey,
      message: resolveMessage(fallbackErrorKey, locale),
      details: undefined as unknown,
    };
  }

  private pickRequestId(req: Request) {
    const header = req.headers['x-request-id'];
    if (Array.isArray(header)) {
      return header[0];
    }
    return header;
  }

  private pickAcceptLanguage(req: Request) {
    const header = req.headers['accept-language'];
    if (Array.isArray(header)) {
      return header[0];
    }

    return header;
  }
}
