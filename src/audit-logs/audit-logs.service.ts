import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: {
    actorId?: string;
    module: string;
    action: string;
    targetId?: string;
    targetType?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        module: data.module,
        action: data.action,
        targetId: data.targetId,
        targetType: data.targetType,
        before: data.before,
        after: data.after,
      },
    });
  }

  async findLogs(page = 1, limit = 100, detail = false) {
	const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.auditLog.findMany({
        skip,
        take: safeLimit,
        orderBy: { timestamp: 'desc' },
      });
    }

    return this.prisma.auditLog.findMany({
      skip,
      take: safeLimit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        actorId: true,
        module: true,
        action: true,
        targetId: true,
        targetType: true,
        timestamp: true,
      },
    });
  }

  async findLogById(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async findLogsByModule(module: string, page = 1, limit = 50, detail = false) {
	const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.auditLog.findMany({
        where: { module },
        skip,
        take: safeLimit,
        orderBy: { timestamp: 'desc' },
      });
    }

    return this.prisma.auditLog.findMany({
      where: { module },
      skip,
      take: safeLimit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        actorId: true,
        module: true,
        action: true,
        targetId: true,
        targetType: true,
        timestamp: true,
      },
    });
  }

  async findLogsByActor(actorId: string, page = 1, limit = 50, detail = false) {
	const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.auditLog.findMany({
        where: { actorId },
        skip,
        take: safeLimit,
        orderBy: { timestamp: 'desc' },
      });
    }

    return this.prisma.auditLog.findMany({
      where: { actorId },
      skip,
      take: safeLimit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        actorId: true,
        module: true,
        action: true,
        targetId: true,
        targetType: true,
        timestamp: true,
      },
    });
  }

  async findLogsByTarget(targetId: string, targetType: string, page = 1, limit = 50) {
	const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;
    return this.prisma.auditLog.findMany({
      where: { targetId, targetType },
      skip,
      take: safeLimit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        actorId: true,
        module: true,
        action: true,
        targetId: true,
        targetType: true,
        timestamp: true,
      },
    });
  }

  async findLogsByDateRange(startDate: Date, endDate: Date) {
    return this.prisma.auditLog.findMany({
      where: { timestamp: { gte: startDate, lte: endDate } },
      orderBy: { timestamp: 'desc' },
    });
  }
}
