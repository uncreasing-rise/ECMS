import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class RequestLoggingInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly slowRequestMs;
    private readonly sampleRate;
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
