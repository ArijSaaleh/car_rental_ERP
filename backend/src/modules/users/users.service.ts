import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(agencyId: string | null, query: any = {}) {
    const whereClause: any = agencyId ? { agencyId } : {};
    
    // Support role filtering (comma-separated roles)
    if (query.role) {
      const roles = query.role.split(',').map((r: string) => r.trim());
      whereClause.role = { in: roles };
    }
    
    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        agencyId: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLogin: true,
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, updateData: any) {
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
