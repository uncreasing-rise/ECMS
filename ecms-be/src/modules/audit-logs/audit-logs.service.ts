import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    user_id?: string;
    action: string;
    target_type?: string;
    target_id?: string;
    old_value?: Prisma.InputJsonValue;
    new_value?: Prisma.InputJsonValue;
    ip_address?: string;
  }) {
    return this.prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        user_id: params.user_id,
        action: params.action,
        target_type: params.target_type,
        target_id: params.target_id,
        old_value: params.old_value,
        new_value: params.new_value,
        ip_address: params.ip_address,
        created_at: new Date(),
      },
    });
  }
}
