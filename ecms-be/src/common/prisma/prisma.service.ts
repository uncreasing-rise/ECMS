import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is missing');
    }
    const maxConnections = parseInt(config.get<string>('DB_MAX_POOL_SIZE') || '100', 10);
    const pool = new Pool({ 
      connectionString,
      max: maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureDeviceTokensTable();
    await this.ensureChatTables();
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

  private async ensureChatTables() {
    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id uuid PRIMARY KEY,
        type varchar(20) NOT NULL,
        name varchar(120),
        direct_fingerprint varchar(200) UNIQUE,
        created_by uuid NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
        created_at timestamp(6) NOT NULL DEFAULT now(),
        updated_at timestamp(6) NOT NULL DEFAULT now(),
        last_message_at timestamp(6),
        last_message_preview text
      );
    `);

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY,
        conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender_id uuid NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
        content text NOT NULL,
        created_at timestamp(6) NOT NULL DEFAULT now()
      );
    `);

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_conversation_members (
        id uuid PRIMARY KEY,
        conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at timestamp(6) NOT NULL DEFAULT now(),
        unread_count integer NOT NULL DEFAULT 0,
        last_delivered_message_id uuid,
        last_delivered_at timestamp(6),
        last_read_message_id uuid,
        last_read_at timestamp(6),
        CONSTRAINT chat_conversation_members_conversation_id_user_id_idx UNIQUE (conversation_id, user_id)
      );
    `);

    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS chat_conversations_created_by_idx ON chat_conversations(created_by);',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx ON chat_conversations(updated_at);',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS chat_conversations_last_message_at_idx ON chat_conversations(last_message_at);',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_created_at_idx ON chat_messages(conversation_id, created_at);',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON chat_messages(sender_id);',
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS chat_conversation_members_user_id_idx ON chat_conversation_members(user_id);',
    );
  }
}
