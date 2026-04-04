import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: {
    userId: string;
    deviceName?: string;
    ipAddress?: string;
    status?: string;
    risk?: string;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        deviceName: data.deviceName,
        ipAddress: data.ipAddress,
        status: data.status || 'active',
        risk: data.risk,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findUserSessions(userId: string, page = 1, limit = 10, detail = false) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.session.findMany({
        where: { userId },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    return this.prisma.session.findMany({
      where: { userId },
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveSessions(userId: string) {
    const now = new Date();
    return this.prisma.session.findMany({
      where: { userId, status: 'active', expiresAt: { gt: now } },
    });
  }

  async findSessionById(id: string) {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async updateSessionStatus(id: string, status: string) {
    return this.prisma.session.update({ where: { id }, data: { status } });
  }

  async terminateSession(id: string) {
    return this.prisma.session.update({ where: { id }, data: { status: 'terminated' } });
  }

  async revokeUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'revoked' },
    });
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    return this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  }
}
