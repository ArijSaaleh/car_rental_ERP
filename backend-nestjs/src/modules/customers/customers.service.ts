import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(agencyId: string) {
    return this.prisma.customer.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, agencyId: string) {
    return this.prisma.customer.findFirst({
      where: { id, agencyId },
    });
  }

  async update(id: number, agencyId: string, updateCustomerDto: UpdateCustomerDto) {
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

  async remove(id: number, agencyId: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
