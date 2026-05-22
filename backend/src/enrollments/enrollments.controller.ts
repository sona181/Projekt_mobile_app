import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EnrollmentsService } from './enrollments.service.js';

class EnrollDto {
  @IsUUID()
  courseId: string;
}

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private enrollments: EnrollmentsService) {}

  @Post()
  enroll(@Request() req: { user: { id: string } }, @Body() dto: EnrollDto) {
    return this.enrollments.enroll(req.user.id, dto.courseId);
  }

  @Get('me')
  myCourses(@Request() req: { user: { id: string } }) {
    return this.enrollments.myCourses(req.user.id);
  }

  @Get('me/:courseId')
  getEnrollment(
    @Request() req: { user: { id: string } },
    @Param('courseId') courseId: string,
  ) {
    return this.enrollments.getEnrollment(req.user.id, courseId);
  }
}
