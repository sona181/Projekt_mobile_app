import { Module } from '@nestjs/common';
import { InstructorDashboardController } from './instructor-dashboard.controller.js';
import { InstructorDashboardService } from './instructor-dashboard.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [InstructorDashboardController],
  providers: [InstructorDashboardService, PrismaService],
})
export class InstructorDashboardModule {}
