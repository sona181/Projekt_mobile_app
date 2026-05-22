import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use.');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'student',
        isActive: true,
        isVerified: false,
        createdAt: now,
        updatedAt: now,
        profile: {
          create: {
            displayName: dto.displayName,
            createdAt: now,
            updatedAt: now,
          },
        },
        settings: {
          create: {
            emailNotifications: true,
            language: 'en',
            darkMode: false,
            updatedAt: now,
          },
        },
        energy: {
          create: {
            currentEnergy: 100,
            maxEnergy: 100,
            lastRefillAt: now,
            updatedAt: now,
          },
        },
        streak: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: now,
            updatedAt: now,
          },
        },
      },
      include: { profile: true },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials.');

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), tokens };
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.email, user.role);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitize(user: { id: string; email: string; role: string; isActive: boolean; isVerified: boolean; profile?: { displayName: string; avatarUrl?: string | null; bio?: string | null; country?: string | null; timezone?: string | null } | null }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            avatarUrl: user.profile.avatarUrl ?? undefined,
            bio: user.profile.bio ?? undefined,
            country: user.profile.country ?? undefined,
            timezone: user.profile.timezone ?? undefined,
          }
        : undefined,
    };
  }
}
