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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LeadsService = class LeadsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createLead(data) {
        return this.prisma.lead.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                source: data.source,
                status: data.status,
                score: data.score || 0,
                ownerId: data.ownerId,
                branchId: data.branchId,
            },
            include: { branch: true, owner: true },
        });
    }
    async findAllLeads(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return this.prisma.lead.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { branch: true, owner: true },
        });
    }
    async findLeadById(id) {
        return this.prisma.lead.findUnique({
            where: { id },
            include: { branch: true, owner: true, statusHistory: true, consultations: true },
        });
    }
    async findLeadsByOwner(ownerId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return this.prisma.lead.findMany({
            where: { ownerId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { branch: true, owner: true },
        });
    }
    async findLeadsByStatus(status, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return this.prisma.lead.findMany({
            where: { status },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { branch: true, owner: true },
        });
    }
    async updateLead(id, data) {
        return this.prisma.lead.update({
            where: { id },
            data,
            include: { branch: true, owner: true },
        });
    }
    async updateLeadStatus(id, status) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead)
            throw new Error('Lead not found');
        await this.prisma.leadStatusHistory.create({
            data: {
                leadId: id,
                fromStatus: lead.status,
                toStatus: status,
            },
        });
        return this.prisma.lead.update({
            where: { id },
            data: { status },
            include: { statusHistory: true },
        });
    }
    async logConsultation(data) {
        return this.prisma.consultation.create({
            data: {
                leadId: data.leadId,
                staffId: data.staffId,
                date: data.date,
                outcome: data.outcome,
                followUpNote: data.followUpNote,
                followUpDate: data.followUpDate,
                status: data.status || 'pending',
            },
        });
    }
    async findLeadConsultations(leadId) {
        return this.prisma.consultation.findMany({
            where: { leadId },
            orderBy: { date: 'desc' },
        });
    }
    async getLeadStatusHistory(leadId) {
        return this.prisma.leadStatusHistory.findMany({
            where: { leadId },
            orderBy: { changedAt: 'desc' },
        });
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map