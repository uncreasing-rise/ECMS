"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const audit_logs_service_1 = require("./audit-logs.service");
const create_audit_log_dto_1 = require("./dto/create-audit-log.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
let AuditLogsController = class AuditLogsController {
    auditLogsService;
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    createLog(createAuditLogDto) {
        return this.auditLogsService.createLog(createAuditLogDto);
    }
    findLogs(query) {
        return this.auditLogsService.findLogs(query.page, query.limit);
    }
    findLogsByModule(module, query) {
        return this.auditLogsService.findLogsByModule(module, query.page, query.limit);
    }
    findLogsByActor(actorId, query) {
        return this.auditLogsService.findLogsByActor(actorId, query.page, query.limit);
    }
    findLogsByTarget(targetId, targetType) {
        return this.auditLogsService.findLogsByTarget(targetId, targetType);
    }
    findLogById(id) {
        return this.auditLogsService.findLogById(id);
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_audit_log_dto_1.CreateAuditLogDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "createLog", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findLogs", null);
__decorate([
    (0, common_1.Get)('module/:module'),
    __param(0, (0, common_1.Param)('module')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findLogsByModule", null);
__decorate([
    (0, common_1.Get)('actor/:actorId'),
    __param(0, (0, common_1.Param)('actorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findLogsByActor", null);
__decorate([
    (0, common_1.Get)('target/:targetId/:targetType'),
    __param(0, (0, common_1.Param)('targetId')),
    __param(1, (0, common_1.Param)('targetType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findLogsByTarget", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findLogById", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('audit-logs'),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map