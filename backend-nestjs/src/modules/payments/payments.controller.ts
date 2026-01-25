import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  findAll() {
    return [];
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  create(@Body() createPaymentDto: any) {
    return {};
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  update(@Param('id') id: string, @Body() updatePaymentDto: any) {
    return {};
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return {};
  }
}
