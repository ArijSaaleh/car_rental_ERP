import { Controller, Get, Post, Patch, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('agencies')
@ApiBearerAuth()
@Controller('agencies')
@UseGuards(RolesGuard)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Get all agencies' })
  findAll(@CurrentUser() user: any) {
    // If PROPRIETAIRE, only return their owned agencies and branches
    if (user.role === UserRole.PROPRIETAIRE) {
      return this.agenciesService.findByOwnerId(user.id);
    }
    // SUPER_ADMIN gets all agencies
    return this.agenciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific agency' })
  findOne(@Param('id') id: string) {
    return this.agenciesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Create a new agency' })
  create(@Body() createData: any, @CurrentUser() user: any) {
    return this.agenciesService.create(createData, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Update an agency' })
  update(@Param('id') id: string, @Body() updateData: any, @CurrentUser() user: any) {
    return this.agenciesService.update(id, updateData, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Delete an agency' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agenciesService.remove(id, user);
  }

  @Post(':id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Toggle agency active status' })
  toggleStatus(@Param('id') id: string) {
    return this.agenciesService.toggleStatus(id);
  }
}
