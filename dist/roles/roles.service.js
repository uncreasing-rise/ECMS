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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRole(data) {
        return this.prisma.role.create({
            data: { name: data.name, status: data.status },
            include: { rolePermissions: true },
        });
    }
    async findRoleById(id) {
        return this.prisma.role.findUnique({
            where: { id },
            include: { rolePermissions: true },
        });
    }
    async findAllRoles(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return this.prisma.role.findMany({
            skip,
            take: limit,
            include: { rolePermissions: true },
        });
    }
    async updateRole(id, data) {
        return this.prisma.role.update({
            where: { id },
            data,
            include: { rolePermissions: true },
        });
    }
    async deleteRole(id) {
        return this.prisma.role.delete({ where: { id } });
    }
    async createPermission(data) {
        return this.prisma.permission.create({
            data: { name: data.name, category: data.category, action: data.action },
        });
    }
    async findPermissionById(id) {
        return this.prisma.permission.findUnique({ where: { id } });
    }
    async findAllPermissions(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        return this.prisma.permission.findMany({
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        });
    }
    async updatePermission(id, data) {
        return this.prisma.permission.update({ where: { id }, data });
    }
    async deletePermission(id) {
        return this.prisma.permission.delete({ where: { id } });
    }
    async getRolePermissions(roleId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        return this.prisma.rolePermission.findMany({
            where: { roleId },
            skip,
            take: limit,
            include: { permission: true },
        });
    }
    async grantPermissionToRole(roleId, permissionId) {
        return this.prisma.rolePermission.create({
            data: { roleId, permissionId },
        });
    }
    async revokePermissionFromRole(roleId, permissionId) {
        try {
            return this.prisma.rolePermission.delete({
                where: { roleId_permissionId: { roleId, permissionId } },
            });
        }
        catch (e) {
        }
    }
    async assignRoleToUser(userId, roleId) {
        return this.prisma.userRole.create({
            data: { userId, roleId },
            include: { user: true, role: true },
        });
    }
    async revokeRoleFromUser(userId, roleId) {
        try {
            return this.prisma.userRole.delete({
                where: { userId_roleId: { userId, roleId } },
            });
        }
        catch (e) {
        }
    }
    async getUserRoles(userId) {
        return this.prisma.userRole.findMany({
            where: { userId },
            include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map