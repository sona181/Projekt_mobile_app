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
import { InstructorDashboardService } from './instructor-dashboard.service.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';

@Controller('instructor')
export class InstructorDashboardController {
  constructor(private readonly dashboardService: InstructorDashboardService) {}

  /** GET /instructor/:id/dashboard */
  @Get(':id/dashboard')
  getDashboard(@Param('id') id: string) {
    return this.dashboardService.getDashboard(id);
  }

  /** GET /instructor/:id/notifications */
  @Get(':id/notifications')
  getNotifications(@Param('id') id: string) {
    return this.dashboardService.getNotifications(id);
  }

  /** GET /instructor/:id/notes */
  @Get(':id/notes')
  getNotes(@Param('id') id: string) {
    return this.dashboardService.getNotes(id);
  }

  /** POST /instructor/:id/notes */
  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  createNote(@Param('id') id: string, @Body() dto: CreateNoteDto) {
    return this.dashboardService.createNote(id, dto);
  }

  /** GET /instructor/:id/courses */
  @Get(':id/courses')
  getCourses(@Param('id') id: string) {
    return this.dashboardService.getCourses(id);
  }

  /** GET /instructor/:id/earnings */
  @Get(':id/earnings')
  getEarnings(@Param('id') id: string) {
    return this.dashboardService.getEarnings(id);
  }

  /** PATCH /instructor/bookings/:bookingId/status */
  @Patch('bookings/:bookingId/status')
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.dashboardService.updateBookingStatus(bookingId, dto.status);
  }
}
