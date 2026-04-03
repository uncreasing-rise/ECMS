import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(data: { name: string; status: string }) {
    return this.prisma.role.create({
      data: { name: data.name, status: data.status },
      include: { rolePermissions: true },
    });
  }

  async findRoleById(id: string) {
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

  async updateRole(id: string, data: { name?: string; status?: string }) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: { rolePermissions: true },
    });
  }

  async deleteRole(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  async createPermission(data: { name: string; category: string; action: string }) {
    return this.prisma.permission.create({
      data: { name: data.name, category: data.category, action: data.action },
    });
  }

  async findPermissionById(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany();
  }

  async updatePermission(id: string, data: { name?: string; category?: string; action?: string }) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async deletePermission(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }

  async getRolePermissions(roleId: string) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  }

  async grantPermissionToRole(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  async revokePermissionFromRole(roleId: string, permissionId: string) {
    try {
      return this.prisma.rolePermission.delete({
        where: { roleId_permissionId: { roleId, permissionId } },
      });
    } catch (e) {
      // Record not found
    }
  }

  async assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: { userId, roleId },
      include: { user: true, role: true },
    });
  }

  async revokeRoleFromUser(userId: string, roleId: string) {
    try {
      return this.prisma.userRole.delete({
        where: { userId_roleId: { userId, roleId } },
      });
    } catch (e) {
      // Record not found
    }
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
  }
}
