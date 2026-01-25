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
}
