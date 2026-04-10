import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly pubClient: any,
    private readonly subClient: any,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }
}
