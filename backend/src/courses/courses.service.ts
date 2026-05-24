import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type EnrollmentWithProgress = Prisma.EnrollmentGetPayload<{ include: { courseProgress: true } }>;

export interface CourseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  level?: string;
  language?: string;
  isPremium?: boolean;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async list(query: CourseListQuery, userId?: string) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'published' };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.level) where.level = query.level;
    if (query.language) where.language = query.language;
    if (query.isPremium !== undefined) where.isPremium = query.isPremium;
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { include: { profile: true } },
          category: true,
          _count: { select: { enrollments: true, reviews: true, chapters: true } },
          reviews: { select: { rating: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    // Attach isEnrolled flag if user is logged in
    let enrolledCourseIds = new Set<string>();
    if (userId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId, courseId: { in: courses.map((c) => c.id) } },
        select: { courseId: true },
      });
      enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    }

    return {
      data: courses.map((c) => this.formatCourse(c, enrolledCourseIds.has(c.id))),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        author: { include: { profile: true } },
        category: true,
        landingPage: true,
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                lessonType: true,
                orderIndex: true,
                durationSeconds: true,
                isFreePreview: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { include: { profile: true } } },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found.');

    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : null;

    let isEnrolled = false;
    let enrollment: EnrollmentWithProgress | null = null;
    if (userId) {
      enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        include: { courseProgress: true },
      });
      isEnrolled = !!enrollment;
    }

    return {
      ...this.formatCourse(course, isEnrolled),
      chapters: course.chapters,
      landingPage: course.landingPage
        ? {
            headline: course.landingPage.headline,
            subheadline: course.landingPage.subheadline,
            objectives: course.landingPage.objectives,
            targetAudience: course.landingPage.targetAudience,
            faq: course.landingPage.faq,
          }
        : null,
      recentReviews: course.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          displayName: r.user.profile?.displayName ?? r.user.email,
          avatarUrl: r.user.profile?.avatarUrl ?? null,
        },
      })),
      avgRating,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.courseProgress,
          }
        : null,
    };
  }

  async getLessonWithContent(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        lessonContents: { orderBy: { orderIndex: 'asc' } },
        exercises: { orderBy: { orderIndex: 'asc' } },
        assets: true,
        chapter: { include: { course: { select: { id: true, title: true, slug: true, authorId: true } } } },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found.');
    return lesson;
  }

  async listCategories() {
    return this.prisma.courseCategory.findMany({
      where: { parentId: null },
      include: { children: true, _count: { select: { courses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  private formatCourse(
    course: {
      id: string;
      title: string;
      slug: string;
      description?: string | null;
      level: string;
      status: string;
      isPremium: boolean;
      price?: { toNumber: () => number } | null;
      thumbnailUrl?: string | null;
      language: string;
      publishedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      author: { id: string; email: string; profile?: { displayName: string; avatarUrl?: string | null } | null };
      category?: { id: string; name: string; slug: string } | null;
      _count: { enrollments: number; reviews: number; chapters?: number };
      reviews: { rating: number }[];
    },
    isEnrolled: boolean,
  ) {
    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
        : null;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      level: course.level,
      isPremium: course.isPremium,
      price: course.price ? Number(course.price) : null,
      thumbnailUrl: course.thumbnailUrl,
      language: course.language,
      publishedAt: course.publishedAt,
      category: course.category,
      author: {
        id: course.author.id,
        displayName: course.author.profile?.displayName ?? course.author.email,
        avatarUrl: course.author.profile?.avatarUrl ?? null,
      },
      stats: {
        enrollments: course._count.enrollments,
        reviews: course._count.reviews,
        chapters: course._count.chapters ?? 0,
        avgRating,
      },
      isEnrolled,
    };
  }
}
