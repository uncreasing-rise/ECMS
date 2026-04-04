import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.sub as string | undefined;
    if (userId) {
      return `user:${userId}`;
    }

    const forwardedFor = req.headers?.['x-forwarded-for'];
    const firstForwardedIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : undefined;

    const ip = firstForwardedIp || req.ip || req.socket?.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const req = context.switchToHttp().getRequest<Record<string, any>>();
    const route = (req.route?.path as string | undefined) || req.url || 'unknown';
    return `${name}:${suffix}:${req.method}:${route}`;
  }
}