import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable()
export class ReadCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Record<string, any>>();
    if (!this.isCacheableRequest(req)) {
      return next.handle();
    }

    const userKey = (req.user?.sub as string | undefined) ?? 'anon';
    const cacheKey = `api-read:${userKey}:${req.originalUrl || req.url}`;
    const ttlSeconds = Number(process.env.CACHE_READ_TTL_SECONDS ?? '15');

    return from(this.cacheManager.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached !== undefined) {
          return of(cached);
        }

        return next.handle().pipe(
          tap(async (response) => {
            try {
              await this.cacheManager.set(cacheKey, response, ttlSeconds);
            } catch {
              // Best-effort cache set.
            }
          }),
        );
      }),
    );
  }

  private isCacheableRequest(req: Record<string, any>): boolean {
    if (req.method !== 'GET') {
      return false;
    }

    const url = String(req.originalUrl || req.url || '');
    if (
      url.startsWith('/docs') ||
      url.startsWith('/metrics') ||
      url.startsWith('/api/v1/auth')
    ) {
      return false;
    }

    const detail = req.query?.detail;
    if (detail === 'true' || detail === '1' || detail === true) {
      return false;
    }

    return (
      url.startsWith('/api/v1/users') ||
      url.startsWith('/api/v1/roles') ||
      url.startsWith('/api/v1/branches') ||
      url.startsWith('/api/v1/courses') ||
      url.startsWith('/api/v1/classes') ||
      url.startsWith('/api/v1/enrollments') ||
      url.startsWith('/api/v1/finance') ||
      url.startsWith('/api/v1/leads') ||
      url.startsWith('/api/v1/sessions') ||
      url.startsWith('/api/v1/audit-logs')
    );
  }
}
