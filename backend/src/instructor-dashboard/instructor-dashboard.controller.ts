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
import { CreateChapterDto } from './dto/create-chapter.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { InstructorDashboardService } from './instructor-dashboard.service.js';

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

  /** POST /instructor/:id/courses */
  @Post(':id/courses')
  @HttpCode(HttpStatus.CREATED)
  createCourse(@Param('id') id: string, @Body() dto: CreateCourseDto) {
    return this.dashboardService.createCourse(id, dto);
  }

  /** PATCH /instructor/:id/courses/:courseId */
  @Patch(':id/courses/:courseId')
  updateCourse(@Param('id') id: string, @Param('courseId') courseId: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.dashboardService.updateCourse(courseId, id, dto);
  }

  /** PATCH /instructor/:id/courses/:courseId/publish */
  @Patch(':id/courses/:courseId/publish')
  publishCourse(@Param('id') id: string, @Param('courseId') courseId: string) {
    return this.dashboardService.publishCourse(courseId, id);
  }

  /** POST /instructor/:id/courses/:courseId/chapters */
  @Post(':id/courses/:courseId/chapters')
  @HttpCode(HttpStatus.CREATED)
  createChapter(@Param('id') id: string, @Param('courseId') courseId: string, @Body() dto: CreateChapterDto) {
    return this.dashboardService.createChapter(courseId, id, dto);
  }

  /** PATCH /instructor/:id/courses/:courseId/chapters/:chapterId */
  @Patch(':id/courses/:courseId/chapters/:chapterId')
  updateChapter(
    @Param('id') id: string,
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: Partial<CreateChapterDto>,
  ) {
    return this.dashboardService.updateChapter(chapterId, courseId, id, dto);
  }

  /** POST /instructor/:id/courses/:courseId/chapters/:chapterId/lessons */
  @Post(':id/courses/:courseId/chapters/:chapterId/lessons')
  @HttpCode(HttpStatus.CREATED)
  createLesson(
    @Param('id') id: string,
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.dashboardService.createLesson(chapterId, courseId, id, dto);
  }

  /** PATCH /instructor/:id/courses/:courseId/chapters/:chapterId/lessons/:lessonId */
  @Patch(':id/courses/:courseId/chapters/:chapterId/lessons/:lessonId')
  updateLesson(
    @Param('id') id: string,
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: Partial<CreateLessonDto>,
  ) {
    return this.dashboardService.updateLesson(lessonId, chapterId, courseId, id, dto);
  }
}
