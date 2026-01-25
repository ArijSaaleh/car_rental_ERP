import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
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

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(@Param('id') id: string, @Body('reason') reason: string, @TenantContext() tenant: any) {
    return this.bookingsService.cancel(+id, tenant.agencyId, reason);
  }
}
