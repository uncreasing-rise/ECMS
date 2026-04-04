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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SessionsService = class SessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSession(data) {
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
    async findUserSessions(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return this.prisma.session.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findActiveSessions(userId) {
        const now = new Date();
        return this.prisma.session.findMany({
            where: { userId, status: 'active', expiresAt: { gt: now } },
        });
    }
    async findSessionById(id) {
        return this.prisma.session.findUnique({ where: { id } });
    }
    async updateSessionStatus(id, status) {
        return this.prisma.session.update({ where: { id }, data: { status } });
    }
    async terminateSession(id) {
        return this.prisma.session.update({ where: { id }, data: { status: 'terminated' } });
    }
    async revokeUserSessions(userId) {
        return this.prisma.session.updateMany({
            where: { userId, status: 'active' },
            data: { status: 'revoked' },
        });
    }
    async cleanupExpiredSessions() {
        const now = new Date();
        return this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map