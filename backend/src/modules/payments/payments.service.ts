import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(agencyId: string, filters: any = {}) {
    const where: any = { agencyId };
    
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

  async findOne(id: number, agencyId: string) {
    return this.prisma.payment.findFirst({
      where: { id, agencyId },
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

  async update(id: number, agencyId: string, updatePaymentDto: any) {
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

  async remove(id: number, agencyId: string) {
    return this.prisma.payment.delete({
      where: { id },
    });
  }
}
