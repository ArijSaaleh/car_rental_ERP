import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
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

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users in the agency (or all users for SUPER_ADMIN)' })
  findAll(@TenantContext() tenant: any, @CurrentUser() user: any, @Query() query: any) {
    // SUPER_ADMIN gets all users, others get agency users only
    const agencyId = user.role === UserRole.SUPER_ADMIN ? query.agencyId || null : tenant.agencyId;
    return this.usersService.findAll(agencyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROPRIETAIRE)
  @ApiOperation({ summary: 'Deactivate a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
