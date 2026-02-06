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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantContext } from '../../common/decorators/tenant.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(@Body() createCustomerDto: CreateCustomerDto, @TenantContext() tenant: any) {
    return this.customersService.create(tenant.agencyId, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers for the agency' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  findAll(@TenantContext() tenant: any) {
    return this.customersService.findAll(tenant);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.customersService.findOne(+id, tenant);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER, UserRole.AGENT_COMPTOIR)
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @TenantContext() tenant: any,
  ) {
    return this.customersService.update(+id, tenant, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.customersService.remove(+id, tenant);
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'Get customer booking history' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  getBookings(@Param('id') id: string, @TenantContext() tenant: any) {
    return this.customersService.getBookings(+id, tenant);
  }

  @Put(':id/blacklist')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle customer blacklist status' })
  @ApiResponse({ status: 200, description: 'Blacklist status updated' })
  toggleBlacklist(@Param('id') id: string, @Body() data: any, @TenantContext() tenant: any) {
    return this.customersService.toggleBlacklist(+id, tenant, data.is_blacklisted, data.reason);
  }
}
