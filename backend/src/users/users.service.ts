import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, streak: true, energy: true },
    });
    if (!user) throw new NotFoundException();

    const totalXp = await this.prisma.xpLog.aggregate({
      where: { userId },
      _sum: { xpAmount: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: user.profile,
      streak: user.streak,
      energy: user.energy,
      totalXp: totalXp._sum.xpAmount ?? 0,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const now = new Date();
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: { ...dto, updatedAt: now },
      create: {
        userId,
        displayName: dto.displayName ?? 'User',
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        country: dto.country,
        timezone: dto.timezone,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { updatedAt: now },
    });

    return profile;
  }

  async updateInstructorProfile(
    userId: string,
    dto: {
      displayName?: string;
      bio?: string;
      specialties?: string;
      languages?: string;
      hourlyRate?: number;
      isAvailable?: boolean;
    },
  ) {
    const now = new Date();

    if (dto.displayName !== undefined || dto.bio !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: dto.displayName ?? '',
          bio: dto.bio,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
          updatedAt: now,
        },
      });
    }

    await this.prisma.instructorProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: dto.bio,
        specialties: dto.specialties,
        languages: dto.languages,
        hourlyRate: dto.hourlyRate,
        isVerified: false,
        isAvailable: dto.isAvailable ?? true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.specialties !== undefined ? { specialties: dto.specialties } : {}),
        ...(dto.languages !== undefined ? { languages: dto.languages } : {}),
        ...(dto.hourlyRate !== undefined ? { hourlyRate: dto.hourlyRate } : {}),
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
        updatedAt: now,
      },
    });

    return { ok: true };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        instructorProfile: {
          include: { availabilitySlots: { select: { id: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException();

    await this.prisma.$transaction(async (tx) => {
      // Quiz attempts
      const quizAttempts = await tx.quizAttempt.findMany({ where: { userId }, select: { id: true } });
      if (quizAttempts.length) {
        await tx.quizAttemptAnswer.deleteMany({ where: { attemptId: { in: quizAttempts.map((a) => a.id) } } });
      }
      await tx.quizAttempt.deleteMany({ where: { userId } });

      // Placement attempts
      const placements = await tx.placementAttempt.findMany({ where: { userId }, select: { id: true } });
      if (placements.length) {
        await tx.placementAnswer.deleteMany({ where: { placementAttemptId: { in: placements.map((a) => a.id) } } });
      }
      await tx.placementAttempt.deleteMany({ where: { userId } });

      // Course enrollments
      const enrollments = await tx.enrollment.findMany({ where: { userId }, select: { id: true } });
      if (enrollments.length) {
        const eIds = enrollments.map((e) => e.id);
        await tx.lessonProgress.deleteMany({ where: { enrollmentId: { in: eIds } } });
        await tx.courseProgress.deleteMany({ where: { enrollmentId: { in: eIds } } });
      }
      await tx.certificate.deleteMany({ where: { userId } });
      await tx.enrollment.deleteMany({ where: { userId } });

      // Daily plans (must precede reviewQueueItem and userPathEnrollment)
      const dailyPlans = await tx.dailyPlan.findMany({ where: { userId }, select: { id: true } });
      if (dailyPlans.length) {
        await tx.dailyPlanItem.deleteMany({ where: { dailyPlanId: { in: dailyPlans.map((d) => d.id) } } });
      }
      await tx.dailyPlan.deleteMany({ where: { userId } });

      // Review queue
      await tx.reviewQueueItem.deleteMany({ where: { userId } });

      // Path enrollments
      const pathEnrollments = await tx.userPathEnrollment.findMany({ where: { userId }, select: { id: true } });
      if (pathEnrollments.length) {
        await tx.userPathProgress.deleteMany({ where: { enrollmentId: { in: pathEnrollments.map((e) => e.id) } } });
      }
      await tx.userPathEnrollment.deleteMany({ where: { userId } });

      // Student session bookings
      const studentBookings = await tx.sessionBooking.findMany({ where: { studentId: userId }, select: { id: true } });
      if (studentBookings.length) {
        const sbIds = studentBookings.map((b) => b.id);
        const liveSessions = await tx.liveSession.findMany({ where: { bookingId: { in: sbIds } }, select: { id: true } });
        if (liveSessions.length) {
          await tx.sessionNote.deleteMany({ where: { sessionId: { in: liveSessions.map((ls) => ls.id) } } });
        }
        await tx.liveSession.deleteMany({ where: { bookingId: { in: sbIds } } });
      }
      await tx.sessionBooking.deleteMany({ where: { studentId: userId } });

      // Notes authored by this user
      await tx.sessionNote.deleteMany({ where: { authorId: userId } });

      // Payments, subscriptions
      await tx.payment.deleteMany({ where: { userId } });
      await tx.userSubscription.deleteMany({ where: { userId } });

      // Gamification
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.userBadge.deleteMany({ where: { userId } });
      await tx.xpLog.deleteMany({ where: { userId } });
      await tx.energyTransaction.deleteMany({ where: { userId } });

      // Misc
      await tx.onboardingResponse.deleteMany({ where: { userId } });
      await tx.courseReview.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });

      // Instructor-specific
      if (user.instructorProfile) {
        const instId = user.instructorProfile.id;

        // Instructor bookings
        const instBookings = await tx.sessionBooking.findMany({ where: { instructorId: instId }, select: { id: true } });
        if (instBookings.length) {
          const ibIds = instBookings.map((b) => b.id);
          const instLive = await tx.liveSession.findMany({ where: { bookingId: { in: ibIds } }, select: { id: true } });
          if (instLive.length) {
            await tx.sessionNote.deleteMany({ where: { sessionId: { in: instLive.map((ls) => ls.id) } } });
          }
          await tx.liveSession.deleteMany({ where: { bookingId: { in: ibIds } } });
          await tx.payment.deleteMany({ where: { bookingId: { in: ibIds } } });
        }
        await tx.sessionBooking.deleteMany({ where: { instructorId: instId } });

        // Availability slots
        const slotIds = user.instructorProfile.availabilitySlots.map((s) => s.id);
        if (slotIds.length) {
          await tx.availabilitySlot.deleteMany({ where: { id: { in: slotIds } } });
        }

        // Instructor's courses
        const courses = await tx.course.findMany({
          where: { authorId: userId },
          select: { id: true, chapters: { select: { id: true, lessons: { select: { id: true } } } } },
        });
        if (courses.length) {
          const courseIds = courses.map((c) => c.id);

          // Other students' enrollments in these courses
          const otherEnrollments = await tx.enrollment.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } });
          if (otherEnrollments.length) {
            const oeIds = otherEnrollments.map((e) => e.id);
            await tx.lessonProgress.deleteMany({ where: { enrollmentId: { in: oeIds } } });
            await tx.courseProgress.deleteMany({ where: { enrollmentId: { in: oeIds } } });
            await tx.enrollment.deleteMany({ where: { id: { in: oeIds } } });
          }
          await tx.certificate.deleteMany({ where: { courseId: { in: courseIds } } });

          await tx.payment.deleteMany({ where: { courseId: { in: courseIds } } });

          const lessonIds = courses.flatMap((c) => c.chapters.flatMap((ch) => ch.lessons.map((l) => l.id)));
          if (lessonIds.length) {
            await tx.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
            await tx.lessonContent.deleteMany({ where: { lessonId: { in: lessonIds } } });
            await tx.courseExercise.deleteMany({ where: { lessonId: { in: lessonIds } } });
            await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
          }

          const chapterIds = courses.flatMap((c) => c.chapters.map((ch) => ch.id));
          if (chapterIds.length) {
            await tx.chapter.deleteMany({ where: { id: { in: chapterIds } } });
          }

          await tx.courseAuthor.deleteMany({ where: { courseId: { in: courseIds } } });
          await tx.course.deleteMany({ where: { id: { in: courseIds } } });
        }

        await tx.instructorProfile.delete({ where: { id: instId } });
      }

      // CourseAuthor entries where this user is a co-author on other courses
      await tx.courseAuthor.deleteMany({ where: { userId } });

      // Core profile records
      await tx.userProfile.deleteMany({ where: { userId } });
      await tx.userSettings.deleteMany({ where: { userId } });
      await tx.userStreak.deleteMany({ where: { userId } });
      await tx.userEnergy.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    }, { timeout: 30000 });

    return { success: true };
  }
}
