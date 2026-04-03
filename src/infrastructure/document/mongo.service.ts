import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);
  private client: MongoClient | null = null;
  private database: Db | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const uri = this.configService.get<string>('MONGODB_URI');
    const dbName = this.configService.get<string>('MONGODB_DB', 'ecms');

    if (!uri) {
      this.logger.warn('MONGODB_URI not configured, MongoDB client is disabled');
      return;
    }

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.database = this.client.db(dbName);
  }

  getDb(): Db {
    if (!this.database) {
      throw new Error('MongoDB is not initialized');
    }
    return this.database;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.close();
  }
}
