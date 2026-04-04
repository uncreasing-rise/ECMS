import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    createRole(createRoleDto: CreateRoleDto): Promise<{
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
    findAllRoles(query: PaginationQueryDto): Promise<({
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
    updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<{
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
    createPermission(createPermissionDto: CreatePermissionDto): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    }>;
    findAllPermissions(): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    }[]>;
    findPermissionById(id: string): Promise<{
        id: string;
        name: string;
        category: string;
        action: string;
    } | null>;
    updatePermission(id: string, updatePermissionDto: CreatePermissionDto): Promise<{
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
    grantPermissionToRole(roleId: string, permissionId: string): Promise<{
        roleId: string;
        permissionId: string;
    }>;
    revokePermissionFromRole(roleId: string, permissionId: string): Promise<{
        roleId: string;
        permissionId: string;
    } | undefined>;
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
}
