import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // Helper to get all agency IDs for an owner
  private async getOwnerAgencyIds(userId: string): Promise<string[]> {
    const agencies = await this.prisma.agency.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return agencies.map((a) => a.id);
  }

  async create(agencyId: string, createPaymentDto: any) {
    return this.prisma.payment.create({
      data: {
        agencyId,
        bookingId: createPaymentDto.bookingId,
        amount: createPaymentDto.amount,
        paymentMethod: createPaymentDto.paymentMethod,
        paymentReference: createPaymentDto.transactionId || `PAY-${Date.now()}`,
        paidAt: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
        status: createPaymentDto.status || 'COMPLETED',
      },
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });
  }

  async findAll(tenant: any, filters: any = {}) {
    const where: any = {};

    // If owner, get all payments from owned agencies
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }

    if (filters.bookingId) {
      where.bookingId = parseInt(filters.bookingId);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findOne(id: number, tenant?: any) {
    const where: any = { id };

    // If tenant is provided, scope by agency
    if (tenant) {
      if (tenant.isOwner) {
        const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
        where.agencyId = { in: agencyIds };
      } else {
        where.agencyId = tenant.agencyId;
      }
    }

    return this.prisma.payment.findFirst({
      where,
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });
  }

  async update(id: number, tenant: any, updatePaymentDto: any) {
    // Verify payment belongs to user's agency (or one of owner's agencies)
    const payment = await this.findOne(id, tenant);

    if (!payment) {
      throw new Error('Payment not found or does not belong to your agency');
    }

    const updateData: any = {};

    if (updatePaymentDto.amount !== undefined) {
      updateData.amount = updatePaymentDto.amount;
    }

    if (updatePaymentDto.paymentMethod) {
      updateData.paymentMethod = updatePaymentDto.paymentMethod;
    }

    if (updatePaymentDto.paymentDate) {
      updateData.paidAt = new Date(updatePaymentDto.paymentDate);
    }

    if (updatePaymentDto.status) {
      updateData.status = updatePaymentDto.status;
    }

    if (updatePaymentDto.transactionId) {
      updateData.paymentReference = updatePaymentDto.transactionId;
    }

    return this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });
  }

  async remove(id: number, tenant: any) {
    // Verify payment belongs to user's agency (or one of owner's agencies)
    const payment = await this.findOne(id, tenant);

    if (!payment) {
      throw new Error('Payment not found or does not belong to your agency');
    }

    return this.prisma.payment.delete({
      where: { id },
    });
  }
}
