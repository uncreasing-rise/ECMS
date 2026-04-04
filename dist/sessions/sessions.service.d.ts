import { PrismaService } from '../prisma/prisma.service';
export declare class SessionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSession(data: {
        userId: string;
        deviceName?: string;
        ipAddress?: string;
        status?: string;
        risk?: string;
        expiresAt: Date;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    }>;
    findUserSessions(userId: string, page?: number, limit?: number, detail?: boolean): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    }[]>;
    findActiveSessions(userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    }[]>;
    findSessionById(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    } | null>;
    updateSessionStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    }>;
    terminateSession(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    }>;
    revokeUserSessions(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    cleanupExpiredSessions(): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
