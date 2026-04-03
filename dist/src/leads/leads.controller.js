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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const update_lead_dto_1 = require("./dto/update-lead.dto");
const create_consultation_dto_1 = require("./dto/create-consultation.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    createLead(createLeadDto) {
        return this.leadsService.createLead(createLeadDto);
    }
    findAllLeads(query) {
        return this.leadsService.findAllLeads(query.page, query.limit);
    }
    findLeadsByOwner(ownerId, query) {
        return this.leadsService.findLeadsByOwner(ownerId, query.page, query.limit);
    }
    findLeadsByStatus(status, query) {
        return this.leadsService.findLeadsByStatus(status, query.page, query.limit);
    }
    findLeadById(id) {
        return this.leadsService.findLeadById(id);
    }
    updateLead(id, updateLeadDto) {
        return this.leadsService.updateLead(id, updateLeadDto);
    }
    updateLeadStatus(id, body) {
        return this.leadsService.updateLeadStatus(id, body.status);
    }
    logConsultation(leadId, createConsultationDto) {
        return this.leadsService.logConsultation({
            ...createConsultationDto,
            leadId,
            date: new Date(createConsultationDto.date),
            followUpDate: createConsultationDto.followUpDate ? new Date(createConsultationDto.followUpDate) : undefined,
        });
    }
    findLeadConsultations(leadId) {
        return this.leadsService.findLeadConsultations(leadId);
    }
    getLeadStatusHistory(leadId) {
        return this.leadsService.getLeadStatusHistory(leadId);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAllLeads", null);
__decorate([
    (0, common_1.Get)('owner/:ownerId'),
    __param(0, (0, common_1.Param)('ownerId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findLeadsByOwner", null);
__decorate([
    (0, common_1.Get)('status/:status'),
    __param(0, (0, common_1.Param)('status')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findLeadsByStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findLeadById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_dto_1.UpdateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "updateLeadStatus", null);
__decorate([
    (0, common_1.Post)(':leadId/consultations'),
    __param(0, (0, common_1.Param)('leadId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_consultation_dto_1.CreateConsultationDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "logConsultation", null);
__decorate([
    (0, common_1.Get)(':leadId/consultations'),
    __param(0, (0, common_1.Param)('leadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findLeadConsultations", null);
__decorate([
    (0, common_1.Get)(':leadId/history'),
    __param(0, (0, common_1.Param)('leadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "getLeadStatusHistory", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map