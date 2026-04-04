import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    createSession(createSessionDto: CreateSessionDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        deviceName: string | null;
        ipAddress: string | null;
        risk: string | null;
        expiresAt: Date;
    }>;
    findUserSessions(userId: string, query: ListQueryDto): Promise<{
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
    updateSessionStatus(id: string, body: {
        status: string;
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
}
