import { PrismaService } from '../prisma/prisma.service';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRole(data: {
        name: string;
        status: string;
    }): Promise<{
        rolePermissions: {
            roleId: string;
            permissionId: string;
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    }>;
    findRoleById(id: string): Promise<({
        rolePermissions: {
            roleId: string;
            permissionId: string;
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    }) | null>;
    findAllRoles(page?: number, limit?: number): Promise<({
        rolePermissions: {
            roleId: string;
            permissionId: string;
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    })[]>;
    updateRole(id: string, data: {
        name?: string;
        status?: string;
    }): Promise<{
        rolePermissions: {
            roleId: string;
            permissionId: string;
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    }>;
    deleteRole(id: string): Promise<{
        id: string;
        status: string;
        name: string;
        description: string | null;
    }>;
    createPermission(data: {
        name: string;
        category: string;
        action: string;
    }): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    }>;
    findPermissionById(id: string): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    } | null>;
    findAllPermissions(page?: number, limit?: number): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    }[]>;
    updatePermission(id: string, data: {
        name?: string;
        category?: string;
        action?: string;
    }): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    }>;
    deletePermission(id: string): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    }>;
    getRolePermissions(roleId: string, page?: number, limit?: number): Promise<({
        permission: {
            id: string;
            name: string;
            category: string;
            action: string;
        };
    } & {
        roleId: string;
        permissionId: string;
    })[]>;
    grantPermissionToRole(roleId: string, permissionId: string): Promise<{
        roleId: string;
        permissionId: string;
    }>;
    revokePermissionFromRole(roleId: string, permissionId: string): Promise<{
        roleId: string;
        permissionId: string;
    } | undefined>;
    assignRoleToUser(userId: string, roleId: string): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            id: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            branchId: string | null;
            accountType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        role: {
            id: string;
            status: string;
            name: string;
            description: string | null;
        };
    } & {
        userId: string;
        roleId: string;
        assignedAt: Date;
        revokedAt: Date | null;
    }>;
    revokeRoleFromUser(userId: string, roleId: string): Promise<{
        userId: string;
        roleId: string;
        assignedAt: Date;
        revokedAt: Date | null;
    } | undefined>;
    getUserRoles(userId: string): Promise<({
        role: {
            rolePermissions: ({
                permission: {
                    id: string;
                    name: string;
                    category: string;
                    action: string;
                };
            } & {
                roleId: string;
                permissionId: string;
            })[];
        } & {
            id: string;
            status: string;
            name: string;
            description: string | null;
        };
    } & {
        userId: string;
        roleId: string;
        assignedAt: Date;
        revokedAt: Date | null;
    })[]>;
}
