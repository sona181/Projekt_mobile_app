import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CreateChapterDto } from './dto/create-chapter.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { CreateLessonContentDto } from './dto/create-lesson-content.dto.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { InstructorDashboardService } from './instructor-dashboard.service.js';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

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

  /** GET /instructor/:id/lessons/:lessonId/content */
  @Get(':id/lessons/:lessonId/content')
  getLessonContent(@Param('lessonId') lessonId: string) {
    return this.dashboardService.getLessonContent(lessonId);
  }

  /** POST /instructor/:id/lessons/:lessonId/content */
  @Post(':id/lessons/:lessonId/content')
  @HttpCode(HttpStatus.CREATED)
  addLessonContent(@Param('lessonId') lessonId: string, @Body() dto: CreateLessonContentDto) {
    return this.dashboardService.addLessonContent(lessonId, dto);
  }

  /** GET /instructor/:id/lessons/:lessonId/exercises */
  @Get(':id/lessons/:lessonId/exercises')
  getExercises(@Param('lessonId') lessonId: string) {
    return this.dashboardService.getExercises(lessonId);
  }

  /** POST /instructor/:id/lessons/:lessonId/exercise */
  @Post(':id/lessons/:lessonId/exercise')
  @HttpCode(HttpStatus.CREATED)
  addExercise(@Param('lessonId') lessonId: string, @Body() dto: CreateExerciseDto) {
    return this.dashboardService.addExercise(lessonId, dto);
  }

  /** POST /instructor/:id/courses/:courseId/lessons/:lessonId/upload */
  @Post(':id/courses/:courseId/lessons/:lessonId/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  uploadLessonFile(
    @Param('id') _id: string,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('contentType') contentType: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;
    return this.dashboardService.registerUploadedAsset(courseId, lessonId, file, contentType ?? 'video', fileUrl);
  }
}
