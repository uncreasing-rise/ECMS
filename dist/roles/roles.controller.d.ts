import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    createRole(createRoleDto: CreateRoleDto): Promise<{
        _count: {
            userRoles: number;
            rolePermissions: number;
        };
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    }>;
    findAllRoles(query: ListQueryDto): Promise<({
        _count: {
            userRoles: number;
        };
        rolePermissions: {
            permission: {
                id: string;
                name: string;
                category: string;
                action: string;
            };
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    })[] | ({
        _count: {
            userRoles: number;
            rolePermissions: number;
        };
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    })[]>;
    findRoleById(id: string): Promise<({
        _count: {
            userRoles: number;
        };
        rolePermissions: {
            permission: {
                id: string;
                name: string;
                category: string;
                action: string;
            };
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
    }) | null>;
    updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        _count: {
            userRoles: number;
            rolePermissions: number;
        };
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
    findAllPermissions(query: PaginationQueryDto): Promise<{
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
    getRolePermissions(roleId: string, query: PaginationQueryDto): Promise<({
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
