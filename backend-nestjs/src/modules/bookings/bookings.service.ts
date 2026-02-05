import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '../../common/enums';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, createData: any) {
    // Check vehicle availability
    const conflicts = await this.prisma.booking.findMany({
      where: {
        vehicleId: createData.vehicleId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            AND: [
              { startDate: { lte: createData.startDate } },
              { endDate: { gte: createData.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: createData.endDate } },
              { endDate: { gte: createData.endDate } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new BadRequestException('Vehicle not available for selected dates');
    }

    // Generate booking number
    const bookingNumber = `BK-${Date.now()}`;

    return this.prisma.booking.create({
      data: {
        ...createData,
        agencyId,
        bookingNumber,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
      include: {
        vehicle: true,
        customer: true,
      },
    });
  }

  async findAll(agencyId: string, filters: any = {}) {
    return this.prisma.booking.findMany({
      where: {
        agencyId,
        ...filters,
      },
      include: {
        vehicle: true,
        customer: true,
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, agencyId: string) {
    return this.prisma.booking.findFirst({
      where: { id, agencyId },
      include: {
        vehicle: true,
        customer: true,
        contract: true,
        payments: true,
        invoices: true,
      },
    });
  }

  async update(id: number, agencyId: string, updateData: any) {
    return this.prisma.booking.update({
      where: { id },
      data: updateData,
    });
  }

  async cancel(id: number, agencyId: string, reason: string) {
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
      },
    });
  }

  async remove(id: number, agencyId: string) {
    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async checkAvailability(vehicleId: string, startDate: Date, endDate: Date, agencyId: string) {
    // Check if vehicle exists and belongs to agency
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, agencyId },
    });

    if (!vehicle) {
      return { available: false, message: 'Vehicle not found' };
    }

    if (vehicle.status !== 'DISPONIBLE') {
      return { available: false, message: `Vehicle is ${vehicle.status}` };
    }

    // Check for overlapping bookings
    const overlappingBookings = await this.prisma.booking.count({
      where: {
        vehicleId,
        agencyId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    return { 
      available: overlappingBookings === 0,
      message: overlappingBookings > 0 ? 'Vehicle is already booked for this period' : 'Vehicle is available',
    };
  }

  async confirm(id: number, agencyId: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  async start(id: number, agencyId: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { 
        status: BookingStatus.IN_PROGRESS,
        pickupDatetime: new Date(),
      },
    });
  }

  async complete(id: number, agencyId: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { 
        status: BookingStatus.COMPLETED,
        returnDatetime: new Date(),
      },
    });
  }
}
