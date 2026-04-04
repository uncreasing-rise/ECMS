import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly pool: Pool;

	constructor(config: ConfigService) {
		const connectionString = config.get<string>('DATABASE_URL');
		if (!connectionString) {
			throw new Error('DATABASE_URL is missing');
		}
		const pool = new Pool({ connectionString });
		const adapter = new PrismaPg(pool);

		super({ adapter });
		this.pool = pool;
	}

	async onModuleInit() {
		await this.$connect();
		await this.ensureDeviceTokensTable();
	}

	async onModuleDestroy() {
		await this.$disconnect();
		await this.pool.end();
	}

	private async ensureDeviceTokensTable() {
		await this.$executeRawUnsafe(`
			CREATE TABLE IF NOT EXISTS device_tokens (
				id uuid PRIMARY KEY,
				user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				fcm_token text NOT NULL UNIQUE,
				device_name varchar(100),
				platform varchar(20),
				is_active boolean NOT NULL DEFAULT true,
				last_used_at timestamp(6),
				created_at timestamp(6) NOT NULL DEFAULT now()
			);
		`);

		await this.$executeRawUnsafe(
			'CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);',
		);
		await this.$executeRawUnsafe(
			'CREATE INDEX IF NOT EXISTS device_tokens_fcm_token_idx ON device_tokens(fcm_token);',
		);
	}
}
