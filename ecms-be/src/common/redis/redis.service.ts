import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'node:crypto';

type RedisBackend = {
  set(
    key: string,
    value: string,
    mode?: 'EX',
    ttlSeconds?: number,
  ): Promise<unknown>;
  setNx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  quit(): Promise<unknown>;
};

interface UpstashResponse {
  result?: unknown;
}

class IoRedisClientAdapter implements RedisBackend {
  constructor(private readonly redis: Redis) {}

  async set(
    key: string,
    value: string,
    mode?: 'EX',
    ttlSeconds?: number,
  ): Promise<unknown> {
    if (mode === 'EX' && ttlSeconds) {
      return this.redis.set(key, value, mode, ttlSeconds);
    }
    return this.redis.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setNx(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    return this.redis.expire(key, ttlSeconds);
  }

  async quit(): Promise<unknown> {
    return this.redis.quit();
  }
}

class UpstashRestClient implements RedisBackend {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async call(path: string): Promise<UpstashResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Upstash request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<UpstashResponse>;
  }

  async set(
    key: string,
    value: string,
    mode?: 'EX',
    ttlSeconds?: number,
  ): Promise<unknown> {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(value);
    const exParam = mode === 'EX' && ttlSeconds ? `?EX=${ttlSeconds}` : '';
    const data = await this.call(
      `/set/${encodedKey}/${encodedValue}${exParam}`,
    );
    return data?.result;
  }

  async get(key: string): Promise<string | null> {
    const data = await this.call(`/get/${encodeURIComponent(key)}`);
    return typeof data.result === 'string' ? data.result : null;
  }

  async setNx(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(value);
    const data = await this.call(
      `/set/${encodedKey}/${encodedValue}?NX=true&EX=${ttlSeconds}`,
    );
    return data?.result === 'OK';
  }

  async del(key: string): Promise<number> {
    const data = await this.call(`/del/${encodeURIComponent(key)}`);
    return Number(data?.result ?? 0);
  }

  async incr(key: string): Promise<number> {
    const data = await this.call(`/incr/${encodeURIComponent(key)}`);
    return Number(data?.result ?? 0);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    const data = await this.call(
      `/expire/${encodeURIComponent(key)}/${ttlSeconds}`,
    );
    return Number(data?.result ?? 0);
  }

  async quit(): Promise<void> {
    return;
  }
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisBackend;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    const upstashUrl = this.config.get<string>('UPSTASH_REDIS_REST_URL');
    const upstashToken = this.config.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (redisUrl) {
      const redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      });

      redisClient.on('connect', () => this.logger.log('Redis connected (TCP)'));
      redisClient.on('error', (err) => this.logger.error('Redis error', err));
      this.client = new IoRedisClientAdapter(redisClient);
      return;
    }

    if (upstashUrl && upstashToken) {
      this.client = new UpstashRestClient(upstashUrl, upstashToken);
      this.logger.log('Redis connected (Upstash REST)');
      return;
    }

    throw new Error(
      'Missing Redis config: set REDIS_URL or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN',
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─── Token Blacklist ──────────────────────────
  async blacklistToken(token: string, ttlSeconds: number) {
    await this.client.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const val = await this.client.get(`blacklist:${token}`);
    return val === '1';
  }

  // ─── OTP / Verify Token ───────────────────────
  async setVerifyToken(userId: string, token: string, ttlSeconds = 86400) {
    await this.client.set(
      `verify:${userId}`,
      this.hashToken(token),
      'EX',
      ttlSeconds,
    );
  }

  async getVerifyToken(userId: string): Promise<string | null> {
    return this.client.get(`verify:${userId}`);
  }

  async delVerifyToken(userId: string) {
    await this.client.del(`verify:${userId}`);
  }

  // ─── Reset Password Token ─────────────────────
  async setResetToken(userId: string, token: string, ttlSeconds = 3600) {
    await this.client.set(
      `reset:${userId}`,
      this.hashToken(token),
      'EX',
      ttlSeconds,
    );
  }

  async getResetToken(userId: string): Promise<string | null> {
    return this.client.get(`reset:${userId}`);
  }

  async delResetToken(userId: string) {
    await this.client.del(`reset:${userId}`);
  }

  // ─── Failed Login Counter ─────────────────────
  async incrementFailedLogin(email: string): Promise<number> {
    const key = `failed_login:${email}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, 900); // reset sau 15 phút
    }
    return count;
  }

  async getFailedLogin(email: string): Promise<number> {
    const val = await this.client.get(`failed_login:${email}`);
    return parseInt(val ?? '0', 10);
  }

  async resetFailedLogin(email: string) {
    await this.client.del(`failed_login:${email}`);
  }

  // ─── Resend Email Cooldown ────────────────────
  async setResendCooldown(userId: string, ttlSeconds = 60) {
    await this.client.set(`resend_cooldown:${userId}`, '1', 'EX', ttlSeconds);
  }

  async hasResendCooldown(userId: string): Promise<boolean> {
    const val = await this.client.get(`resend_cooldown:${userId}`);
    return val === '1';
  }

  // ─── Generic Cache Helpers ───────────────────
  async cacheSet(key: string, value: string, ttlSeconds = 60) {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async cacheGet(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async cacheDel(key: string) {
    await this.client.del(key);
  }

  async invalidateTeacherDashboardCache(teacherId: string) {
    await this.cacheDel(`portal:teacher:dashboard:${teacherId}`);
  }

  async invalidateParentOverviewCache(studentId: string) {
    await this.cacheDel(`portal:parent:overview:${studentId}`);
  }

  async claimIdempotencyKey(key: string, ttlSeconds: number): Promise<boolean> {
    return this.client.setNx(`idempotency:${key}`, '1', ttlSeconds);
  }

  async releaseIdempotencyKey(key: string) {
    await this.client.del(`idempotency:${key}`);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
