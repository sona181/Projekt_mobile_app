import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateChapterDto } from './dto/create-chapter.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { BookingStatus } from './dto/update-booking-status.dto.js';

@Injectable()
export class InstructorDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard Overview ─────────────────────────────────────────────────────
  async getDashboard(instructorId: string) {
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
      include: { profile: true, instructorProfile: true },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const instructorProfileId = instructor.instructorProfile?.id;

    const todayBookings = instructorProfileId
      ? await this.prisma.sessionBooking.findMany({
          where: {
            instructorId: instructorProfileId,
            slot: { startsAt: { gte: today, lt: tomorrow } },
          },
          include: {
            slot: true,
            student: { include: { profile: true } },
          },
          orderBy: { slot: { startsAt: 'asc' } },
        })
      : [];

    const activeStudentsResult = instructorProfileId
      ? await this.prisma.sessionBooking.groupBy({
          by: ['studentId'],
          where: {
            instructorId: instructorProfileId,
            status: { not: 'cancelled' },
          },
        })
      : [];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyEarnings = instructorProfileId
      ? await this.prisma.payment.aggregate({
          where: {
            booking: { instructorId: instructorProfileId },
            status: 'completed',
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        })
      : { _sum: { amount: null } };

    const nextBooking = todayBookings.find(
      (b) => b.slot.startsAt > new Date() && b.status !== 'cancelled',
    );
    const hoursUntilNext = nextBooking
      ? Math.round((nextBooking.slot.startsAt.getTime() - Date.now()) / 3600000)
      : null;

    return {
      instructor: {
        id: instructor.id,
        displayName: instructor.profile?.displayName ?? instructor.email,
        avatarUrl: instructor.profile?.avatarUrl ?? null,
        initials: this.getInitials(instructor.profile?.displayName ?? instructor.email),
      },
      stats: {
        activeStudents: activeStudentsResult.length,
        monthlyEarnings: Number(monthlyEarnings._sum.amount ?? 0),
        todaySessionCount: todayBookings.length,
        hoursUntilNextSession: hoursUntilNext,
      },
      todaySessions: todayBookings.map((b) => ({
        id: b.id,
        studentName: b.student.profile?.displayName ?? b.student.email,
        studentInitials: this.getInitials(b.student.profile?.displayName ?? b.student.email),
        avatarUrl: b.student.profile?.avatarUrl ?? null,
        topic: b.topic ?? 'Pa temë',
        scheduledAt: b.slot.startsAt,
        time: this.formatTime(b.slot.startsAt),
        status: b.status,
      })),
    };
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  async getNotifications(instructorId: string) {
    const unread = await this.prisma.notification.count({
      where: { userId: instructorId, isRead: false },
    });
    return { hasUnread: unread > 0, count: unread };
  }

  // ── Session Notes ──────────────────────────────────────────────────────────
  async getNotes(instructorId: string) {
    const notes = await this.prisma.sessionNote.findMany({
      where: { authorId: instructorId },
      include: {
        session: {
          include: {
            booking: {
              include: { student: { include: { profile: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes.map((n) => ({
      id: n.id,
      studentName:
        n.session.booking.student.profile?.displayName ??
        n.session.booking.student.email,
      date: n.createdAt,
      content: n.content,
      isShared: n.isSharedWithStudent,
    }));
  }

  async createNote(instructorId: string, dto: CreateNoteDto) {
    const now = new Date();
    return this.prisma.sessionNote.create({
      data: {
        sessionId: dto.sessionId,
        authorId: instructorId,
        content: dto.content,
        isSharedWithStudent: dto.isShared,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // ── Courses ────────────────────────────────────────────────────────────────
  async getCourses(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { authorId: instructorId },
      include: {
        _count: { select: { enrollments: true } },
        chapters: { include: { _count: { select: { lessons: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      totalLessons: c.chapters.reduce((sum, ch) => sum + ch._count.lessons, 0),
      studentCount: c._count.enrollments,
      thumbnailUrl: c.thumbnailUrl,
    }));
  }

  // ── Earnings ───────────────────────────────────────────────────────────────
  async getEarnings(instructorId: string) {
    const instructorProfile = await this.prisma.instructorProfile.findUnique({
      where: { userId: instructorId },
    });
    if (!instructorProfile) throw new NotFoundException('Instructor profile not found');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: {
        booking: { instructorId: instructorProfile.id },
        status: 'completed',
        createdAt: { gte: startOfMonth },
      },
      include: {
        user: { include: { profile: true } },
        booking: true,
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      items: payments.map((p) => ({
        id: p.id,
        studentName: p.user.profile?.displayName ?? p.user.email,
        studentInitials: this.getInitials(p.user.profile?.displayName ?? p.user.email),
        avatarUrl: p.user.profile?.avatarUrl ?? null,
        typeLabel: p.bookingId
          ? 'Sesion 1-on-1'
          : p.subscriptionId
          ? 'Abonim mujor'
          : 'Blerje kursi',
        amount: Number(p.amount),
        currency: p.currency,
        paidAt: p.createdAt,
      })),
    };
  }

  // ── Course Creation ────────────────────────────────────────────────────────
  async createCourse(instructorId: string, dto: CreateCourseDto) {
    const slug = await this.uniqueSlug(this.slugify(dto.title));
    const now = new Date();
    const course = await this.prisma.course.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description ?? null,
        categoryId: dto.categoryId ?? null,
        level: dto.level ?? 'beginner',
        language: dto.language ?? 'sq',
        isPremium: dto.isPremium ?? false,
        price: dto.price ?? null,
        status: 'draft',
        authorId: instructorId,
        createdAt: now,
        updatedAt: now,
      },
    });
    return { id: course.id, slug: course.slug };
  }

  async updateCourse(courseId: string, instructorId: string, dto: Partial<CreateCourseDto>) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, authorId: instructorId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.course.update({
      where: { id: courseId },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  async publishCourse(courseId: string, instructorId: string) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, authorId: instructorId } });
    if (!course) throw new NotFoundException('Course not found');
    const now = new Date();
    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: course.status === 'published' ? 'draft' : 'published',
        publishedAt: course.status === 'published' ? null : now,
        updatedAt: now,
      },
      select: { id: true, status: true, publishedAt: true },
    });
  }

  async createChapter(courseId: string, instructorId: string, dto: CreateChapterDto) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, authorId: instructorId } });
    if (!course) throw new NotFoundException('Course not found');
    const count = await this.prisma.chapter.count({ where: { courseId } });
    const now = new Date();
    return this.prisma.chapter.create({
      data: {
        courseId,
        title: dto.title,
        orderIndex: dto.orderIndex ?? count,
        createdAt: now,
      },
    });
  }

  async updateChapter(chapterId: string, courseId: string, instructorId: string, dto: Partial<CreateChapterDto>) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, authorId: instructorId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.chapter.update({ where: { id: chapterId }, data: dto });
  }

  async createLesson(chapterId: string, courseId: string, instructorId: string, dto: CreateLessonDto) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, authorId: instructorId } });
    if (!course) throw new NotFoundException('Course not found');
    const count = await this.prisma.lesson.count({ where: { chapterId } });
    const now = new Date();
    return this.prisma.lesson.create({
      data: {
        chapterId,
        title: dto.title,
        lessonType: dto.lessonType ?? 'text',
        isFreePreview: dto.isFreePreview ?? false,
        orderIndex: dto.orderIndex ?? count,
        createdAt: now,
      },
    });
  }

  async updateLesson(lessonId: string, chapterId: string, courseId: string, instructorId: string, dto: Partial<CreateLessonDto>) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, authorId: instructorId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.lesson.update({ where: { id: lessonId }, data: dto });
  }

  private slugify(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 200);
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let n = 0;
    while (await this.prisma.course.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }

  // ── Bookings ───────────────────────────────────────────────────────────────
  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    return this.prisma.sessionBooking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
