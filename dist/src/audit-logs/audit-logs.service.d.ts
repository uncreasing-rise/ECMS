import { PrismaService } from '../prisma/prisma.service';
export declare class AuditLogsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createLog(data: {
        actorId?: string;
        module: string;
        action: string;
        targetId?: string;
        targetType?: string;
        before?: Record<string, any>;
        after?: Record<string, any>;
    }): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    }>;
    findLogs(page?: number, limit?: number): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogById(id: string): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    } | null>;
    findLogsByModule(module: string, page?: number, limit?: number): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogsByActor(actorId: string, page?: number, limit?: number): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogsByTarget(targetId: string, targetType: string, page?: number, limit?: number): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogsByDateRange(startDate: Date, endDate: Date): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        before: import("@prisma/client/runtime/client").JsonValue | null;
        after: import("@prisma/client/runtime/client").JsonValue | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
}
