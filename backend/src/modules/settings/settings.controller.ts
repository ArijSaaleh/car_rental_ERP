import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { TenantContext } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get system settings' })
  getSettings(@TenantContext() tenant: any, @CurrentUser() user: any) {
    const agencyId = user.role === UserRole.SUPER_ADMIN ? null : tenant.agencyId;
    return this.settingsService.getSettings(agencyId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Update system settings' })
  updateSettings(@Body() settingsData: any, @TenantContext() tenant: any, @CurrentUser() user: any) {
    const agencyId = user.role === UserRole.SUPER_ADMIN ? null : tenant.agencyId;
    return this.settingsService.updateSettings(agencyId, settingsData);
  }
}
