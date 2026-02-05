import { Controller, Get, Post, Patch, Param, Body, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { TenantContext } from '../../common/decorators/tenant.decorator';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@Body() createData: any, @TenantContext() tenant: any) {
    return this.bookingsService.create(tenant.agencyId, createData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  findAll(@Query() filters: any, @TenantContext() tenant: any) {
    return this.bookingsService.findAll(tenant.agencyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific booking' })
  findOne(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.bookingsService.findOne(+id, tenant.agencyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking' })
  update(@Param('id') id: string, @Body() updateData: any, @TenantContext() tenant: any) {
    return this.bookingsService.update(+id, tenant.agencyId, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a booking' })
  remove(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.bookingsService.remove(+id, tenant.agencyId);
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Check vehicle availability for booking dates' })
  checkAvailability(@Body() checkData: any, @TenantContext() tenant: any) {
    return this.bookingsService.checkAvailability(
      checkData.vehicleId, 
      new Date(checkData.startDate), 
      new Date(checkData.endDate),
      tenant.agencyId
    );
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a booking' })
  confirm(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.bookingsService.confirm(+id, tenant.agencyId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a rental (vehicle pickup)' })
  start(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.bookingsService.start(+id, tenant.agencyId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a rental (vehicle return)' })
  complete(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.bookingsService.complete(+id, tenant.agencyId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(@Param('id') id: string, @Body('reason') reason: string, @TenantContext() tenant: any) {
    return this.bookingsService.cancel(+id, tenant.agencyId, reason);
  }
}
