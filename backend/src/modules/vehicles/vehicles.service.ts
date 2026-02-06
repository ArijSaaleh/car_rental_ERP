import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicle.dto';
import { VehicleStatus } from '../../common/enums';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // Helper to get all agency IDs for an owner
  private async getOwnerAgencyIds(userId: string): Promise<string[]> {
    const agencies = await this.prisma.agency.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return agencies.map((a) => a.id);
  }

  /**
   * Create a new vehicle
   */
  async create(agencyId: string, createVehicleDto: CreateVehicleDto) {
    // Check if license plate already exists
    const existing = await this.prisma.vehicle.findUnique({
      where: { licensePlate: createVehicleDto.licensePlate },
    });

    if (existing) {
      throw new BadRequestException('Vehicle with this license plate already exists');
    }

    return this.prisma.vehicle.create({
      data: {
        ...createVehicleDto,
        agencyId,
        dailyRate: createVehicleDto.dailyRate,
        depositAmount: createVehicleDto.depositAmount || '0',
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get all vehicles with filtering and pagination
   */
  async findAll(tenant: any, query: VehicleQueryDto) {
    const { page = 1, pageSize = 20, status, brand, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deleted_at: null, // Exclude soft-deleted vehicles
    };

    // If owner, get all vehicles from owned agencies
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }

    if (status) {
      where.status = status;
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single vehicle by ID
   */
  async findOne(id: string, tenant?: any) {
    const where: any = {
      id,
      deleted_at: null, // Exclude soft-deleted vehicles
    };

    // If tenant is provided, scope by agency
    if (tenant) {
      if (tenant.isOwner) {
        const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
        where.agencyId = { in: agencyIds };
      } else {
        where.agencyId = tenant.agencyId;
      }
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'IN_PROGRESS'],
            },
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
        },
        maintenances: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  /**
   * Update a vehicle
   */
  async update(id: string, tenant: any, updateVehicleDto: UpdateVehicleDto) {
    console.log('=== VEHICLE UPDATE DEBUG ===');
    console.log('Vehicle ID:', id);
    console.log('Tenant:', JSON.stringify(tenant, null, 2));
    console.log('Received DTO:', JSON.stringify(updateVehicleDto, null, 2));

    // Verify vehicle belongs to user's agency (or one of owner's agencies)
    const vehicle = await this.findOne(id, tenant);
    console.log('Found vehicle:', vehicle.id);

    // Clean data: remove fields that shouldn't be updated
    const {
      id: _id,
      createdAt,
      updatedAt,
      deleted_at,
      agencyId,
      agency,
      bookings,
      maintenances,
      ...cleanData
    } = updateVehicleDto as any;

    console.log('Clean data to update:', JSON.stringify(cleanData, null, 2));

    const result = await this.prisma.vehicle.update({
      where: { id },
      data: cleanData,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('Update successful');
    return result;
  }

  /**
   * Delete a vehicle (soft delete by setting isActive to false)
   */
  async remove(id: string, tenant: any) {
    // Build where clause for agency check
    const where: any = { id };
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }

    // Find vehicle including soft-deleted ones for delete operation
    const vehicle = await this.prisma.vehicle.findFirst({ where });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if vehicle has active bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        vehicleId: id,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException('Cannot delete vehicle with active bookings');
    }

    // Soft delete: set deleted_at timestamp and mark as inactive
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        isActive: false,
        deleted_at: new Date(),
      },
    });
  }

  /**
   * Check vehicle availability for a date range
   */
  async checkAvailability(vehicleId: string, startDate: Date, endDate: Date) {
    const conflicts = await this.prisma.booking.findMany({
      where: {
        vehicleId,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS'],
        },
        OR: [
          {
            AND: [{ startDate: { lte: startDate } }, { endDate: { gte: startDate } }],
          },
          {
            AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
          },
          {
            AND: [{ startDate: { gte: startDate } }, { endDate: { lte: endDate } }],
          },
        ],
      },
    });

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Get vehicle statistics for an agency
   */
  async getStatistics(tenant: any) {
    const where: any = { isActive: true };

    // If owner, get statistics across all owned agencies
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }

    const [total, available, rented, maintenance, outOfService] = await Promise.all([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.count({ where: { ...where, status: VehicleStatus.DISPONIBLE } }),
      this.prisma.vehicle.count({ where: { ...where, status: VehicleStatus.LOUE } }),
      this.prisma.vehicle.count({ where: { ...where, status: VehicleStatus.MAINTENANCE } }),
      this.prisma.vehicle.count({ where: { ...where, status: VehicleStatus.HORS_SERVICE } }),
    ]);

    return {
      total,
      available,
      rented,
      maintenance,
      outOfService,
      occupancyRate: total > 0 ? ((rented / total) * 100).toFixed(2) : '0.00',
    };
  }
}
