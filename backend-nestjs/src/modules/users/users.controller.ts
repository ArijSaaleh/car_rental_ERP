import { Controller, Get, Patch, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantContext } from '../../common/decorators/tenant.decorator';
import { UserRole } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users in the agency (or all users for SUPER_ADMIN)' })
  findAll(@TenantContext() tenant: any, @CurrentUser() user: any) {
    // SUPER_ADMIN gets all users, others get agency users only
    return this.usersService.findAll(user.role === UserRole.SUPER_ADMIN ? null : tenant.agencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Deactivate a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
