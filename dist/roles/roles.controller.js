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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const roles_service_1 = require("./roles.service");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const create_permission_dto_1 = require("./dto/create-permission.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
let RolesController = class RolesController {
    rolesService;
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    createRole(createRoleDto) {
        return this.rolesService.createRole(createRoleDto);
    }
    findAllRoles(query) {
        return this.rolesService.findAllRoles(query.page, query.limit);
    }
    findRoleById(id) {
        return this.rolesService.findRoleById(id);
    }
    updateRole(id, updateRoleDto) {
        return this.rolesService.updateRole(id, updateRoleDto);
    }
    deleteRole(id) {
        return this.rolesService.deleteRole(id);
    }
    createPermission(createPermissionDto) {
        return this.rolesService.createPermission(createPermissionDto);
    }
    findAllPermissions() {
        return this.rolesService.findAllPermissions();
    }
    findPermissionById(id) {
        return this.rolesService.findPermissionById(id);
    }
    updatePermission(id, updatePermissionDto) {
        return this.rolesService.updatePermission(id, updatePermissionDto);
    }
    deletePermission(id) {
        return this.rolesService.deletePermission(id);
    }
    grantPermissionToRole(roleId, permissionId) {
        return this.rolesService.grantPermissionToRole(roleId, permissionId);
    }
    revokePermissionFromRole(roleId, permissionId) {
        return this.rolesService.revokePermissionFromRole(roleId, permissionId);
    }
    getRolePermissions(roleId) {
        return this.rolesService.getRolePermissions(roleId);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findRoleById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Post)('permissions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Get)('permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Get)('permissions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findPermissionById", null);
__decorate([
    (0, common_1.Patch)('permissions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "updatePermission", null);
__decorate([
    (0, common_1.Delete)('permissions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "deletePermission", null);
__decorate([
    (0, common_1.Post)(':roleId/permissions/:permissionId'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "grantPermissionToRole", null);
__decorate([
    (0, common_1.Delete)(':roleId/permissions/:permissionId'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "revokePermissionFromRole", null);
__decorate([
    (0, common_1.Get)(':roleId/permissions'),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "getRolePermissions", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map