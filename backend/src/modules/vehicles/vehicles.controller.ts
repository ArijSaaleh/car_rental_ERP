import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicle.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantContext } from '../../common/decorators/tenant.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - License plate already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() createVehicleDto: CreateVehicleDto, @TenantContext() tenant: any) {
    return this.vehiclesService.create(tenant.agencyId, createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query: VehicleQueryDto, @TenantContext() tenant: any) {
    return this.vehiclesService.findAll(tenant, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get vehicle statistics for the agency' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(@TenantContext() tenant: any) {
    return this.vehiclesService.getStatistics(tenant);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findOne(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.vehiclesService.findOne(id, tenant.agencyId);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check vehicle availability for a date range' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  checkAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vehiclesService.checkAvailability(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @TenantContext() tenant: any,
  ) {
    return this.vehiclesService.update(id, tenant.agencyId, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a vehicle (soft delete)' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete vehicle with active bookings' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  remove(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.vehiclesService.remove(id, tenant.agencyId);
  }
}
