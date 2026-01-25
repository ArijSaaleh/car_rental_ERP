import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicle.dto';
import { VehicleStatus } from '../../common/enums';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

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
  async findAll(agencyId: string, query: VehicleQueryDto) {
    const { page = 1, pageSize = 20, status, brand, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { agencyId };

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
  async findOne(id: string, agencyId?: string) {
    const where: any = { id };
    
    if (agencyId) {
      where.agencyId = agencyId;
    }

    const vehicle = await this.prisma.vehicle.findUnique({
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
  async update(id: string, agencyId: string, updateVehicleDto: UpdateVehicleDto) {
    // Verify vehicle belongs to agency
    const vehicle = await this.findOne(id, agencyId);

    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
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
   * Delete a vehicle (soft delete by setting isActive to false)
   */
  async remove(id: string, agencyId: string) {
    // Verify vehicle belongs to agency
    await this.findOne(id, agencyId);

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

    return this.prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
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
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
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
  async getStatistics(agencyId: string) {
    const [total, available, rented, maintenance, outOfService] = await Promise.all([
      this.prisma.vehicle.count({ where: { agencyId, isActive: true } }),
      this.prisma.vehicle.count({ where: { agencyId, status: VehicleStatus.DISPONIBLE, isActive: true } }),
      this.prisma.vehicle.count({ where: { agencyId, status: VehicleStatus.LOUE, isActive: true } }),
      this.prisma.vehicle.count({ where: { agencyId, status: VehicleStatus.MAINTENANCE, isActive: true } }),
      this.prisma.vehicle.count({ where: { agencyId, status: VehicleStatus.HORS_SERVICE, isActive: true } }),
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
