import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== 'published') throw new NotFoundException('Course not found.');
    if (course.isPremium) throw new ForbiddenException('A subscription is required for premium courses.');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this course.');

    const now = new Date();
    const totalLessons = await this.prisma.lesson.count({
      where: { chapter: { courseId } },
    });

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'active',
        enrolledAt: now,
        courseProgress: {
          create: {
            totalLessons,
            completedLessons: 0,
            progressPercent: 0,
            updatedAt: now,
          },
        },
      },
      include: { courseProgress: true },
    });

    return enrollment;
  }

  async myCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            author: { include: { profile: true } },
            category: true,
            _count: { select: { chapters: true } },
          },
        },
        courseProgress: true,
      },
    });

    return enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      progress: e.courseProgress,
      course: {
        id: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        thumbnailUrl: e.course.thumbnailUrl,
        level: e.course.level,
        language: e.course.language,
        isPremium: e.course.isPremium,
        category: e.course.category,
        chaptersCount: e.course._count.chapters,
        author: {
          displayName: e.course.author.profile?.displayName ?? e.course.author.email,
          avatarUrl: e.course.author.profile?.avatarUrl ?? null,
        },
      },
    }));
  }

  async getEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        courseProgress: true,
        lessonProgress: { select: { lessonId: true, isCompleted: true, completedAt: true } },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    return enrollment;
  }
}
