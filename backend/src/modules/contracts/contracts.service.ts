import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  // Helper to get all agency IDs for an owner
  private async getOwnerAgencyIds(userId: string): Promise<string[]> {
    const agencies = await this.prisma.agency.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return agencies.map(a => a.id);
  }

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

  async findAll(tenant: any, filters: any = {}) {
    const where: any = {};
    
    // If owner, get all contracts from owned agencies
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }
    
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

    return this.prisma.contract.findFirst({
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

  async update(id: number, tenant: any, updateContractDto: any) {
    // Verify contract belongs to user's agency (or one of owner's agencies)
    const contract = await this.findOne(id, tenant);

    if (!contract) {
      throw new Error('Contract not found or does not belong to your agency');
    }

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

  async remove(id: number, tenant: any) {
    // Verify contract belongs to user's agency (or one of owner's agencies)
    const contract = await this.findOne(id, tenant);

    if (!contract) {
      throw new Error('Contract not found or does not belong to your agency');
    }

    return this.prisma.contract.delete({
      where: { id },
    });
  }

  async generatePdf(id: number, tenant: any) {
    // Get contract data - automatically validates agency access
    const contract = await this.findOne(id, tenant);
    
    if (!contract) {
      throw new Error('Contract not found or does not belong to your agency');
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
