import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Role endpoints
  @Post()
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  findAllRoles(@Query() query: PaginationQueryDto) {
    return this.rolesService.findAllRoles(query.page, query.limit);
  }

  @Get(':id')
  findRoleById(@Param('id') id: string) {
    return this.rolesService.findRoleById(id);
  }

  @Patch(':id')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // Permission endpoints
  @Post('permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  findAllPermissions(@Query() query: PaginationQueryDto) {
    return this.rolesService.findAllPermissions(query.page, query.limit);
  }

  @Get('permissions/:id')
  findPermissionById(@Param('id') id: string) {
    return this.rolesService.findPermissionById(id);
  }

  @Patch('permissions/:id')
  updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: CreatePermissionDto,
  ) {
    return this.rolesService.updatePermission(id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }

  // Role-Permission relationship endpoints
  @Post(':roleId/permissions/:permissionId')
  grantPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.grantPermissionToRole(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  revokePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.revokePermissionFromRole(roleId, permissionId);
  }

  @Get(':roleId/permissions')
  getRolePermissions(
    @Param('roleId') roleId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.rolesService.getRolePermissions(roleId, query.page, query.limit);
  }
}
