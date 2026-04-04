import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { ListQueryMax100Dto } from '../common/dto/list-query-max100.dto';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    createLog(createAuditLogDto: CreateAuditLogDto): Promise<{
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
    findLogs(query: ListQueryMax100Dto): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogsByModule(module: string, query: ListQueryMax100Dto): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogsByActor(actorId: string, query: ListQueryMax100Dto): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
        timestamp: Date;
        actorId: string | null;
    }[]>;
    findLogsByTarget(targetId: string, targetType: string): Promise<{
        id: string;
        action: string;
        module: string;
        targetId: string | null;
        targetType: string | null;
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
}
