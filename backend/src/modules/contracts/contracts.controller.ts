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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { TenantContext } from '../../common/decorators/tenant.decorator';
import { ContractsService } from './contracts.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  findAll(@Query() query: any, @TenantContext() tenant: any) {
    return this.contractsService.findAll(tenant, query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  findOne(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.contractsService.findOne(+id, tenant);
  }

  @Get(':id/pdf')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  async generatePdf(@Param('id') id: string, @Res() res: Response, @TenantContext() tenant: any) {
    const pdfBuffer = await this.contractsService.generatePdf(+id, tenant);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contract-${id}.pdf`);
    res.send(pdfBuffer);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  create(@Body() createContractDto: any, @TenantContext() tenant: any) {
    return this.contractsService.create(tenant.agencyId, createContractDto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  update(@Param('id') id: string, @Body() updateContractDto: any, @TenantContext() tenant: any) {
    return this.contractsService.update(+id, tenant, updateContractDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  remove(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.contractsService.remove(+id, tenant);
  }
}
