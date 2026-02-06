import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
        parentAgency: {
          select: {
            id: true,
            name: true,
          },
        },
        branches: {
          select: {
            id: true,
            name: true,
            city: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            branches: true,
            users: true,
            vehicles: true,
            customers: true,
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

  async create(createData: any, user?: any) {
    // If PROPRIETAIRE is creating, set them as owner
    if (user && user.role === 'PROPRIETAIRE') {
      const data = {
        ...createData,
        ownerId: user.id,
      };

      // Create agency
      const agency = await this.prisma.agency.create({
        data,
        include: {
          owner: true,
          branches: true,
        },
      });

      // If this is a principal agency (no parent), update user's agencyId
      if (!createData.parentAgencyId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { agencyId: agency.id },
        });
      }

      return agency;
    }

    // SUPER_ADMIN can create with any ownerId
    return this.prisma.agency.create({
      data: createData,
      include: {
        owner: true,
        branches: true,
      },
    });
  }

  async update(id: string, updateData: any, user?: any) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // If PROPRIETAIRE, verify they own this agency
    if (user && user.role === 'PROPRIETAIRE') {
      if (agency.ownerId !== user.id) {
        throw new ForbiddenException('You do not have permission to update this agency');
      }
    }

    // Remove fields that shouldn't be updated directly
    const { id: _id, createdAt, updatedAt, owner, branches, _count, ...cleanData } = updateData;

    return this.prisma.agency.update({
      where: { id },
      data: cleanData,
      include: {
        owner: true,
        branches: true,
      },
    });
  }

  async remove(id: string, user?: any) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // If PROPRIETAIRE, verify they own this agency
    if (user && user.role === 'PROPRIETAIRE') {
      if (agency.ownerId !== user.id) {
        throw new ForbiddenException('You do not have permission to delete this agency');
      }
    }

    // Soft delete
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
