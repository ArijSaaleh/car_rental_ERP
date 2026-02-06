import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // Helper to get all agency IDs for an owner
  private async getOwnerAgencyIds(userId: string): Promise<string[]> {
    const agencies = await this.prisma.agency.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return agencies.map(a => a.id);
  }

  async create(agencyId: string, createCustomerDto: CreateCustomerDto) {
    // Split fullName into firstName and lastName
    const nameParts = createCustomerDto.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    return this.prisma.customer.create({
      data: {
        agencyId,
        firstName,
        lastName,
        email: createCustomerDto.email,
        phone: createCustomerDto.phoneNumber,
        address: createCustomerDto.address,
        city: createCustomerDto.city,
        country: createCustomerDto.country || 'Tunisia',
        dateOfBirth: createCustomerDto.dateOfBirth ? new Date(createCustomerDto.dateOfBirth) : undefined,
        cinNumber: createCustomerDto.idCardNumber,
        licenseNumber: createCustomerDto.driverLicenseNumber || '',
        licenseExpiryDate: createCustomerDto.licenseExpiryDate ? new Date(createCustomerDto.licenseExpiryDate) : undefined,
      },
    });
  }

  async findAll(tenant: any) {
    const where: any = {};
    
    // If owner, get all customers from owned agencies
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }
    
    return this.prisma.customer.findMany({
      where,
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

    return this.prisma.customer.findFirst({
      where,
    });
  }

  async update(id: number, tenant: any, updateCustomerDto: UpdateCustomerDto) {
    // Verify customer belongs to user's agency (or one of owner's agencies)
    const customer = await this.findOne(id, tenant);

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to your agency');
    }

    const updateData: any = {
      email: updateCustomerDto.email,
      phone: updateCustomerDto.phoneNumber,
      address: updateCustomerDto.address,
      city: updateCustomerDto.city,
      country: updateCustomerDto.country,
    };

    if (updateCustomerDto.fullName) {
      const nameParts = updateCustomerDto.fullName.split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    }

    if (updateCustomerDto.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateCustomerDto.dateOfBirth);
    }

    if (updateCustomerDto.idCardNumber) {
      updateData.cinNumber = updateCustomerDto.idCardNumber;
    }

    if (updateCustomerDto.driverLicenseNumber) {
      updateData.licenseNumber = updateCustomerDto.driverLicenseNumber;
    }

    if (updateCustomerDto.licenseExpiryDate) {
      updateData.licenseExpiryDate = new Date(updateCustomerDto.licenseExpiryDate);
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number, tenant: any) {
    // Verify customer belongs to user's agency (or one of owner's agencies)
    const customer = await this.findOne(id, tenant);

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to your agency');
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }

  async getBookings(id: number, tenant: any) {
    // Verify customer belongs to user's agency (or one of owner's agencies)
    const customer = await this.findOne(id, tenant);

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to your agency');
    }

    const where: any = { customerId: id };
    
    // Also filter bookings by agency access
    if (tenant.isOwner) {
      const agencyIds = await this.getOwnerAgencyIds(tenant.userId);
      where.agencyId = { in: agencyIds };
    } else {
      where.agencyId = tenant.agencyId;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleBlacklist(id: number, tenant: any, blacklisted: boolean, reason?: string) {
    // Verify customer belongs to user's agency (or one of owner's agencies)
    const customer = await this.findOne(id, tenant);

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to your agency');
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        isBlacklisted: blacklisted,
        blacklistReason: reason || null,
      },
    });
  }
}
