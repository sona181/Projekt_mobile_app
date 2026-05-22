import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, streak: true, energy: true },
    });
    if (!user) throw new NotFoundException();

    const totalXp = await this.prisma.xpLog.aggregate({
      where: { userId },
      _sum: { xpAmount: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: user.profile,
      streak: user.streak,
      energy: user.energy,
      totalXp: totalXp._sum.xpAmount ?? 0,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const now = new Date();
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: { ...dto, updatedAt: now },
      create: {
        userId,
        displayName: dto.displayName ?? 'User',
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        country: dto.country,
        timezone: dto.timezone,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { updatedAt: now },
    });

    return profile;
  }
}
