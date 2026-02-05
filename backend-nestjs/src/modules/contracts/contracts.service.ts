import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(agencyId: string, createContractDto: any) {
    return this.prisma.contract.create({
      data: {
        agencyId,
        bookingId: createContractDto.bookingId,
        contractNumber: `CON-${Date.now()}`,
        termsAndConditions: createContractDto.terms || 'Standard rental terms and conditions',
        status: createContractDto.status || 'DRAFT',
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
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.bookingId) {
      where.bookingId = parseInt(filters.bookingId);
    }

    return this.prisma.contract.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, agencyId: string) {
    return this.prisma.contract.findFirst({
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

  async update(id: number, agencyId: string, updateContractDto: any) {
    const updateData: any = {};
    
    if (updateContractDto.terms) {
      updateData.termsAndConditions = updateContractDto.terms;
    }
    
    if (updateContractDto.status) {
      updateData.status = updateContractDto.status;
    }
    
    if (updateContractDto.customerAcceptedTerms !== undefined) {
      updateData.customerAcceptedTerms = updateContractDto.customerAcceptedTerms;
    }

    return this.prisma.contract.update({
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
    return this.prisma.contract.delete({
      where: { id },
    });
  }

  async generatePdf(id: number, agencyId: string) {
    // Get contract data
    const contract = await this.findOne(id, agencyId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    // TODO: Implement actual PDF generation using a library like pdfkit or puppeteer
    // For now, return a simple text-based representation
    const pdfContent = `
CONTRACT #${contract.contractNumber}
==============================

Agency: ${contract.agencyId}
Customer: ${contract.booking.customer.firstName} ${contract.booking.customer.lastName}
Vehicle: ${contract.booking.vehicle.licensePlate}

Start Date: ${contract.booking.startDate}
End Date: ${contract.booking.endDate}

Total Amount: ${contract.booking.totalAmount} TND
Deposit: ${contract.booking.depositAmount} TND

Terms & Conditions:
${contract.termsAndConditions}

Status: ${contract.status}
    `.trim();

    return Buffer.from(pdfContent, 'utf-8');
  }
}
