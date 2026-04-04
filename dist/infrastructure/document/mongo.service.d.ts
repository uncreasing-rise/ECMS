import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db } from 'mongodb';
export declare class MongoService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    private database;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    getDb(): Db;
    onModuleDestroy(): Promise<void>;
}
