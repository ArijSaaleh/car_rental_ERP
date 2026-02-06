import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        role: createUserDto.role,
        agencyId: createUserDto.agencyId,
        isActive: createUserDto.isActive ?? true,
        isVerified: createUserDto.isVerified ?? false,
      },
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
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

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
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.hashedPassword = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
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

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
