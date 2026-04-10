export const NOTIFICATION_QUEUE_NAME = 'notification-delivery';
export const NOTIFICATION_JOB_NAME = 'deliver-notification';

export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
}

export function parseBullmqRedisConnection(
  redisUrl: string,
): RedisConnectionOptions {
  const url = new URL(redisUrl);
  const isTls = url.protocol === 'rediss:';

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.replace('/', '') || 0) : 0,
    ...(isTls ? { tls: {} } : {}),
  };
}
