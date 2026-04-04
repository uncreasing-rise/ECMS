export declare class CreateAuditLogDto {
    actorId?: string;
    module: string;
    action: string;
    targetId?: string;
    targetType?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
}
