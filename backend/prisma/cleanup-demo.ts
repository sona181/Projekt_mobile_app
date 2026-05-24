import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_COURSE_SLUGS = [
  'javascript-fundamentals',
  'react-for-beginners',
  'python-data-science',
  'nestjs-api-development',
  'react-native-expo',
  'algorithms-and-data-structures',
];

const DEMO_EMAILS = [
  'prof.arben@unilearn.al',
  'prof.blerta@unilearn.al',
  'student@unilearn.al',
  'student2@unilearn.al',
];

async function main() {
  console.log('🧹  Removing demo data…');

  // Delete courses by slug — Prisma cascades to chapters, lessons,
  // lessonContents, exercises, assets, enrollments, reviews, etc.
  const courses = await prisma.course.findMany({
    where: { slug: { in: DEMO_COURSE_SLUGS } },
    select: { id: true, title: true },
  });

  if (courses.length === 0) {
    console.log('  ℹ No demo courses found — already cleaned up.');
  } else {
    for (const c of courses) {
      // Delete dependent records that may not have cascade set
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: c.id },
        select: { id: true },
      });
      const enrollmentIds = enrollments.map((e) => e.id);

      if (enrollmentIds.length > 0) {
        await prisma.lessonProgress.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.courseProgress.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
      }

      await prisma.courseReview.deleteMany({ where: { courseId: c.id } });
      await prisma.courseAsset.deleteMany({ where: { courseId: c.id } });

      // Get all lessons for this course
      const lessons = await prisma.lesson.findMany({
        where: { chapter: { courseId: c.id } },
        select: { id: true },
      });
      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length > 0) {
        await prisma.lessonContent.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await prisma.courseExercise.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await prisma.lesson.deleteMany({ where: { id: { in: lessonIds } } });
      }

      await prisma.chapter.deleteMany({ where: { courseId: c.id } });
      await prisma.course.delete({ where: { id: c.id } });

      console.log(`  ✔ Deleted course: ${c.title}`);
    }
  }

  // Delete demo users (XP logs, streaks, etc. cascade from user)
  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log('  ℹ No demo users found.');
  } else {
    for (const u of users) {
      await prisma.xpLog.deleteMany({ where: { userId: u.id } });
      await prisma.userStreak.deleteMany({ where: { userId: u.id } });
      await prisma.userEnergy.deleteMany({ where: { userId: u.id } });
      await prisma.userSettings.deleteMany({ where: { userId: u.id } });
      await prisma.userProfile.deleteMany({ where: { userId: u.id } });
      await prisma.instructorProfile.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`  ✔ Deleted user: ${u.email}`);
    }
  }

  console.log('\n✅  Demo data removed. Only real instructor courses remain.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
