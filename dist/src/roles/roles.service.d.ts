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
        name: string;
        description: string | null;
        status: string;
    }>;
    findRoleById(id: string): Promise<({
        rolePermissions: {
            roleId: string;
            permissionId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
    }) | null>;
    findAllRoles(page?: number, limit?: number): Promise<({
        rolePermissions: {
            roleId: string;
            permissionId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
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
        name: string;
        description: string | null;
        status: string;
    }>;
    deleteRole(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        status: string;
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
    findAllPermissions(): Promise<{
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
    getRolePermissions(roleId: string): Promise<({
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
        role: {
            id: string;
            name: string;
            description: string | null;
            status: string;
        };
        user: {
            id: string;
            status: string;
            email: string;
            firstName: string;
            lastName: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            phone: string | null;
            branchId: string | null;
            accountType: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
    } & {
        roleId: string;
        userId: string;
        assignedAt: Date;
        revokedAt: Date | null;
    }>;
    revokeRoleFromUser(userId: string, roleId: string): Promise<{
        roleId: string;
        userId: string;
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
            name: string;
            description: string | null;
            status: string;
        };
    } & {
        roleId: string;
        userId: string;
        assignedAt: Date;
        revokedAt: Date | null;
    })[]>;
}
