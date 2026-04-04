import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(data: { name: string; status: string }) {
    return this.prisma.role.create({
      data: { name: data.name, status: data.status },
      include: {
        _count: {
          select: { rolePermissions: true, userRoles: true },
        },
      },
    });
  }

  async findRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                category: true,
                action: true,
              },
            },
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });
  }

  async findAllRoles(page = 1, limit = 10, detail = false) {
	const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.role.findMany({
        skip,
        take: safeLimit,
        orderBy: { name: 'asc' },
        include: {
          rolePermissions: {
            select: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  action: true,
                },
              },
            },
          },
          _count: {
            select: { userRoles: true },
          },
        },
      });
    }

    return this.prisma.role.findMany({
      skip,
      take: safeLimit,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { rolePermissions: true, userRoles: true },
        },
      },
    });
  }

  async updateRole(id: string, data: { name?: string; status?: string }) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { rolePermissions: true, userRoles: true },
        },
      },
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

  async findAllPermissions(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.permission.findMany({
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async updatePermission(id: string, data: { name?: string; category?: string; action?: string }) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async deletePermission(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }

  async getRolePermissions(roleId: string, page = 1, limit = 50) {
	const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      skip,
      take: safeLimit,
      include: {
        permission: {
          select: {
            id: true,
            name: true,
            category: true,
            action: true,
          },
        },
      },
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
