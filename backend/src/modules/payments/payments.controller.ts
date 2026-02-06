import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { TenantContext } from '../../common/decorators/tenant.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  findAll(@Query() query: any, @TenantContext() tenant: any) {
    return this.paymentsService.findAll(tenant, query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  findOne(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.paymentsService.findOne(+id, tenant);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  create(@Body() createPaymentDto: any, @TenantContext() tenant: any) {
    return this.paymentsService.create(tenant.agencyId, createPaymentDto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  update(@Param('id') id: string, @Body() updatePaymentDto: any, @TenantContext() tenant: any) {
    return this.paymentsService.update(+id, tenant, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  remove(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.paymentsService.remove(+id, tenant);
  }
}
