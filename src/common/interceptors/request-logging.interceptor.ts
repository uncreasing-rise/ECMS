import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);
  private readonly slowRequestMs = Number(process.env.REQUEST_LOG_SLOW_MS ?? '1000');
  private readonly sampleRate = Number(process.env.REQUEST_LOG_SAMPLE_RATE ?? '0.02');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsedMs = Date.now() - startedAt;
        const shouldLog = elapsedMs >= this.slowRequestMs || Math.random() < this.sampleRate;

        if (!shouldLog) {
          return;
        }

        this.logger.log(
          `${request.method} ${request.url} ${response.statusCode} - ${elapsedMs}ms`,
        );
      }),
    );
  }
}
