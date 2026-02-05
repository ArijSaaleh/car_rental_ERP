import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.agency.findMany({
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findByOwnerId(ownerId: string) {
    return this.prisma.agency.findMany({
      where: { ownerId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.agency.findUnique({
      where: { id },
      include: {
        owner: true,
        users: true,
        vehicles: {
          take: 10,
        },
      },
    });
  }

  async create(createData: any) {
    return this.prisma.agency.create({
      data: createData,
    });
  }

  async update(id: string, updateData: any) {
    return this.prisma.agency.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.agency.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleStatus(id: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    return this.prisma.agency.update({
      where: { id },
      data: { isActive: !agency.isActive },
    });
  }
}
