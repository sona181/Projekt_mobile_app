import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service.js';
import { CreateSessionRequestDto } from './dto/create-session-request.dto.js';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /** GET /sessions/instructors */
  @Get('instructors')
  listInstructors() {
    return this.sessionsService.listInstructors();
  }

  /** GET /sessions/instructors/:userId */
  @Get('instructors/:userId')
  getInstructorProfile(@Param('userId') userId: string) {
    return this.sessionsService.getInstructorProfile(userId);
  }

  /** POST /sessions/request */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  requestSession(@Body() dto: CreateSessionRequestDto) {
    return this.sessionsService.requestSession(dto);
  }

  /** GET /sessions/student/:studentId */
  @Get('student/:studentId')
  getStudentBookings(@Param('studentId') studentId: string) {
    return this.sessionsService.getStudentBookings(studentId);
  }

  /** GET /sessions/instructor/:instructorUserId/bookings */
  @Get('instructor/:instructorUserId/bookings')
  getInstructorBookings(@Param('instructorUserId') instructorUserId: string) {
    return this.sessionsService.getInstructorBookings(instructorUserId);
  }

  /** PATCH /sessions/:bookingId/status */
  @Patch(':bookingId/status')
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateSessionStatusDto,
  ) {
    return this.sessionsService.updateBookingStatus(bookingId, dto.status);
  }

  /** POST /sessions/:bookingId/start-call */
  @Post(':bookingId/start-call')
  @HttpCode(HttpStatus.CREATED)
  startCall(@Param('bookingId') bookingId: string) {
    return this.sessionsService.startCall(bookingId);
  }

  /** GET /sessions/notifications/:userId */
  @Get('notifications/:userId')
  getNotifications(@Param('userId') userId: string) {
    return this.sessionsService.getNotifications(userId);
  }

  /** PATCH /sessions/notifications/:userId/read */
  @Patch('notifications/:userId/read')
  markRead(@Param('userId') userId: string) {
    return this.sessionsService.markNotificationsRead(userId);
  }
}
