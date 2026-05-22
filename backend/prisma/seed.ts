import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const HASH = (p: string) => bcrypt.hash(p, 10);
const now = new Date();
const ago = (days: number) => new Date(Date.now() - days * 864e5);

async function main() {
  console.log('🌱  Seeding database…');

  // ─── Categories ───────────────────────────────────────────────────────────
  const [webDev, dataSci, mobile, algo] = await Promise.all([
    prisma.courseCategory.upsert({
      where: { slug: 'web-development' },
      update: {},
      create: { name: 'Web Development', slug: 'web-development' },
    }),
    prisma.courseCategory.upsert({
      where: { slug: 'data-science' },
      update: {},
      create: { name: 'Data Science', slug: 'data-science' },
    }),
    prisma.courseCategory.upsert({
      where: { slug: 'mobile-development' },
      update: {},
      create: { name: 'Mobile Development', slug: 'mobile-development' },
    }),
    prisma.courseCategory.upsert({
      where: { slug: 'algorithms' },
      update: {},
      create: { name: 'Algorithms & Data Structures', slug: 'algorithms' },
    }),
  ]);
  console.log('  ✔ Categories');

  // ─── Instructors ──────────────────────────────────────────────────────────
  const instructor1 = await prisma.user.upsert({
    where: { email: 'prof.arben@unilearn.al' },
    update: {},
    create: {
      email: 'prof.arben@unilearn.al',
      passwordHash: await HASH('Password123!'),
      role: 'instructor',
      isActive: true,
      isVerified: true,
      createdAt: ago(90),
      updatedAt: ago(1),
      profile: {
        create: {
          displayName: 'Prof. Arben Krasniqi',
          bio: 'Senior software engineer with 12 years of experience in full-stack development. Loves teaching clean architecture.',
          country: 'AL',
          timezone: 'Europe/Tirane',
          createdAt: ago(90),
          updatedAt: ago(1),
        },
      },
      instructorProfile: {
        create: {
          bio: 'Full-stack developer and university lecturer specialising in web technologies.',
          specialties: 'JavaScript,TypeScript,React,NestJS',
          languages: 'Albanian,English',
          hourlyRate: 25,
          rating: 4.8,
          isVerified: true,
          isAvailable: true,
          createdAt: ago(90),
          updatedAt: ago(1),
        },
      },
    },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: 'prof.blerta@unilearn.al' },
    update: {},
    create: {
      email: 'prof.blerta@unilearn.al',
      passwordHash: await HASH('Password123!'),
      role: 'instructor',
      isActive: true,
      isVerified: true,
      createdAt: ago(80),
      updatedAt: ago(2),
      profile: {
        create: {
          displayName: 'Dr. Blerta Hoxha',
          bio: 'PhD in Computer Science, research focus on machine learning and data pipelines.',
          country: 'AL',
          timezone: 'Europe/Tirane',
          createdAt: ago(80),
          updatedAt: ago(2),
        },
      },
      instructorProfile: {
        create: {
          bio: 'Data scientist and researcher. Teaching Python, ML and data engineering at Epoka University.',
          specialties: 'Python,Machine Learning,Data Engineering,SQL',
          languages: 'Albanian,English,Italian',
          hourlyRate: 30,
          rating: 4.9,
          isVerified: true,
          isAvailable: true,
          createdAt: ago(80),
          updatedAt: ago(2),
        },
      },
    },
  });
  console.log('  ✔ Instructors');

  // ─── Students ─────────────────────────────────────────────────────────────
  const student1 = await prisma.user.upsert({
    where: { email: 'student@unilearn.al' },
    update: {},
    create: {
      email: 'student@unilearn.al',
      passwordHash: await HASH('Password123!'),
      role: 'student',
      isActive: true,
      isVerified: true,
      createdAt: ago(30),
      updatedAt: ago(1),
      profile: {
        create: {
          displayName: 'Andi Berisha',
          bio: 'CS student at Epoka, learning web development.',
          country: 'AL',
          timezone: 'Europe/Tirane',
          createdAt: ago(30),
          updatedAt: ago(1),
        },
      },
      settings: {
        create: {
          emailNotifications: true,
          language: 'en',
          darkMode: false,
          updatedAt: ago(30),
        },
      },
      energy: {
        create: {
          currentEnergy: 80,
          maxEnergy: 100,
          lastRefillAt: ago(1),
          updatedAt: ago(1),
        },
      },
      streak: {
        create: {
          currentStreak: 5,
          longestStreak: 12,
          lastActivityDate: ago(0),
          updatedAt: ago(0),
        },
      },
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@unilearn.al' },
    update: {},
    create: {
      email: 'student2@unilearn.al',
      passwordHash: await HASH('Password123!'),
      role: 'student',
      isActive: true,
      isVerified: true,
      createdAt: ago(15),
      updatedAt: ago(1),
      profile: {
        create: {
          displayName: 'Klara Mema',
          country: 'AL',
          timezone: 'Europe/Tirane',
          createdAt: ago(15),
          updatedAt: ago(1),
        },
      },
      settings: {
        create: {
          emailNotifications: true,
          language: 'en',
          darkMode: true,
          updatedAt: ago(15),
        },
      },
      energy: {
        create: {
          currentEnergy: 100,
          maxEnergy: 100,
          lastRefillAt: now,
          updatedAt: now,
        },
      },
      streak: {
        create: {
          currentStreak: 2,
          longestStreak: 7,
          lastActivityDate: ago(0),
          updatedAt: ago(0),
        },
      },
    },
  });
  console.log('  ✔ Students');

  // ─── Courses ──────────────────────────────────────────────────────────────
  const course1 = await upsertCourse({
    slug: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals',
    description:
      'Master the core concepts of JavaScript from scratch. Variables, functions, arrays, objects, async/await, and the DOM. Perfect for beginners.',
    level: 'beginner',
    language: 'en',
    isPremium: false,
    price: null,
    authorId: instructor1.id,
    categoryId: webDev.id,
    chapters: [
      {
        title: 'Getting Started',
        lessons: [
          { title: 'What is JavaScript?', type: 'text', duration: 300, free: true },
          { title: 'Setting Up Your Environment', type: 'text', duration: 420, free: true },
          { title: 'Your First Script', type: 'video', duration: 600, free: false },
        ],
      },
      {
        title: 'Variables & Data Types',
        lessons: [
          { title: 'var, let and const', type: 'text', duration: 480, free: false },
          { title: 'Strings, Numbers & Booleans', type: 'text', duration: 360, free: false },
          { title: 'Type Coercion', type: 'video', duration: 540, free: false },
          { title: 'Exercise: Data Types', type: 'exercise', duration: null, free: false },
        ],
      },
      {
        title: 'Functions',
        lessons: [
          { title: 'Declaring Functions', type: 'text', duration: 420, free: false },
          { title: 'Arrow Functions', type: 'text', duration: 300, free: false },
          { title: 'Closures Explained', type: 'video', duration: 720, free: false },
          { title: 'Exercise: Write a Calculator', type: 'exercise', duration: null, free: false },
        ],
      },
    ],
  });

  const course2 = await upsertCourse({
    slug: 'react-for-beginners',
    title: 'React for Beginners',
    description:
      'Build modern UIs with React. Covers components, hooks, state management, routing, and connecting to REST APIs.',
    level: 'intermediate',
    language: 'en',
    isPremium: false,
    price: null,
    authorId: instructor1.id,
    categoryId: webDev.id,
    chapters: [
      {
        title: 'React Basics',
        lessons: [
          { title: 'Why React?', type: 'text', duration: 240, free: true },
          { title: 'JSX Syntax', type: 'text', duration: 360, free: true },
          { title: 'Components & Props', type: 'video', duration: 840, free: false },
        ],
      },
      {
        title: 'State & Hooks',
        lessons: [
          { title: 'useState Hook', type: 'video', duration: 720, free: false },
          { title: 'useEffect Hook', type: 'video', duration: 660, free: false },
          { title: 'Custom Hooks', type: 'text', duration: 480, free: false },
          { title: 'Exercise: Todo App', type: 'exercise', duration: null, free: false },
        ],
      },
      {
        title: 'Routing & APIs',
        lessons: [
          { title: 'React Router Setup', type: 'text', duration: 480, free: false },
          { title: 'Fetching Data with Axios', type: 'video', duration: 600, free: false },
          { title: 'Error & Loading States', type: 'text', duration: 360, free: false },
        ],
      },
    ],
  });

  const course3 = await upsertCourse({
    slug: 'python-data-science',
    title: 'Python for Data Science',
    description:
      'Learn Python with a data science focus. Numpy, Pandas, Matplotlib, and intro to machine learning with scikit-learn.',
    level: 'beginner',
    language: 'en',
    isPremium: false,
    price: null,
    authorId: instructor2.id,
    categoryId: dataSci.id,
    chapters: [
      {
        title: 'Python Basics',
        lessons: [
          { title: 'Python Setup & REPL', type: 'text', duration: 300, free: true },
          { title: 'Lists, Dicts & Tuples', type: 'video', duration: 720, free: false },
          { title: 'List Comprehensions', type: 'text', duration: 420, free: false },
        ],
      },
      {
        title: 'NumPy & Pandas',
        lessons: [
          { title: 'Arrays with NumPy', type: 'video', duration: 900, free: false },
          { title: 'DataFrames with Pandas', type: 'video', duration: 960, free: false },
          { title: 'Cleaning Data', type: 'text', duration: 540, free: false },
          { title: 'Exercise: Analyse a CSV', type: 'exercise', duration: null, free: false },
        ],
      },
      {
        title: 'Visualisation',
        lessons: [
          { title: 'Matplotlib Basics', type: 'video', duration: 600, free: false },
          { title: 'Seaborn Charts', type: 'video', duration: 540, free: false },
          { title: 'Exercise: Plot Sales Data', type: 'exercise', duration: null, free: false },
        ],
      },
    ],
  });

  const course4 = await upsertCourse({
    slug: 'nestjs-api-development',
    title: 'NestJS API Development',
    description:
      'Build production-ready REST APIs with NestJS, TypeScript, Prisma and PostgreSQL. JWT auth, guards, pipes, and deployment.',
    level: 'advanced',
    language: 'en',
    isPremium: true,
    price: 29.99,
    authorId: instructor1.id,
    categoryId: webDev.id,
    chapters: [
      {
        title: 'NestJS Architecture',
        lessons: [
          { title: 'Modules, Controllers & Services', type: 'text', duration: 540, free: true },
          { title: 'Dependency Injection', type: 'video', duration: 720, free: false },
          { title: 'Pipes & Validation', type: 'text', duration: 480, free: false },
        ],
      },
      {
        title: 'Database with Prisma',
        lessons: [
          { title: 'Schema Design', type: 'video', duration: 900, free: false },
          { title: 'Migrations & Seeding', type: 'text', duration: 480, free: false },
          { title: 'Relations & Queries', type: 'video', duration: 840, free: false },
        ],
      },
      {
        title: 'Auth & Security',
        lessons: [
          { title: 'JWT Auth Flow', type: 'video', duration: 780, free: false },
          { title: 'Refresh Tokens', type: 'text', duration: 540, free: false },
          { title: 'Role-based Guards', type: 'video', duration: 600, free: false },
          { title: 'Exercise: Secure an Endpoint', type: 'exercise', duration: null, free: false },
        ],
      },
    ],
  });

  const course5 = await upsertCourse({
    slug: 'react-native-expo',
    title: 'React Native with Expo',
    description:
      'Build iOS and Android apps with React Native and Expo. Covers navigation, device APIs, push notifications, and app store deployment.',
    level: 'intermediate',
    language: 'en',
    isPremium: true,
    price: 19.99,
    authorId: instructor1.id,
    categoryId: mobile.id,
    chapters: [
      {
        title: 'Expo Setup',
        lessons: [
          { title: 'Creating Your First App', type: 'text', duration: 360, free: true },
          { title: 'Expo Router Navigation', type: 'video', duration: 780, free: false },
          { title: 'Core Components', type: 'text', duration: 540, free: false },
        ],
      },
      {
        title: 'Device APIs',
        lessons: [
          { title: 'Camera & Image Picker', type: 'video', duration: 720, free: false },
          { title: 'Push Notifications', type: 'video', duration: 660, free: false },
          { title: 'SecureStore & AsyncStorage', type: 'text', duration: 420, free: false },
        ],
      },
    ],
  });

  const course6 = await upsertCourse({
    slug: 'algorithms-and-data-structures',
    title: 'Algorithms & Data Structures',
    description:
      'Crack technical interviews. Master arrays, linked lists, trees, graphs, sorting, searching, dynamic programming and complexity analysis.',
    level: 'intermediate',
    language: 'en',
    isPremium: false,
    price: null,
    authorId: instructor2.id,
    categoryId: algo.id,
    chapters: [
      {
        title: 'Complexity & Arrays',
        lessons: [
          { title: 'Big O Notation', type: 'text', duration: 480, free: true },
          { title: 'Array Operations', type: 'video', duration: 600, free: false },
          { title: 'Two Pointers Technique', type: 'text', duration: 420, free: false },
          { title: 'Exercise: Sliding Window', type: 'exercise', duration: null, free: false },
        ],
      },
      {
        title: 'Trees & Graphs',
        lessons: [
          { title: 'Binary Search Trees', type: 'video', duration: 840, free: false },
          { title: 'BFS & DFS', type: 'video', duration: 780, free: false },
          { title: 'Exercise: Level Order Traversal', type: 'exercise', duration: null, free: false },
        ],
      },
    ],
  });

  console.log('  ✔ Courses');

  // ─── Reviews ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.courseReview.upsert({
      where: { courseId_userId: { courseId: course1.id, userId: student1.id } },
      update: {},
      create: { courseId: course1.id, userId: student1.id, rating: 5, comment: 'Really clear explanations, perfect for beginners!', createdAt: ago(10), updatedAt: ago(10) },
    }),
    prisma.courseReview.upsert({
      where: { courseId_userId: { courseId: course1.id, userId: student2.id } },
      update: {},
      create: { courseId: course1.id, userId: student2.id, rating: 4, comment: 'Great course, I would love more exercises.', createdAt: ago(5), updatedAt: ago(5) },
    }),
    prisma.courseReview.upsert({
      where: { courseId_userId: { courseId: course2.id, userId: student1.id } },
      update: {},
      create: { courseId: course2.id, userId: student1.id, rating: 5, comment: 'The hooks section is excellent!', createdAt: ago(7), updatedAt: ago(7) },
    }),
    prisma.courseReview.upsert({
      where: { courseId_userId: { courseId: course3.id, userId: student2.id } },
      update: {},
      create: { courseId: course3.id, userId: student2.id, rating: 5, comment: 'Dr. Blerta explains Pandas really well.', createdAt: ago(3), updatedAt: ago(3) },
    }),
  ]);
  console.log('  ✔ Reviews');

  // ─── Enrollments ──────────────────────────────────────────────────────────
  await enrollStudent(student1.id, course1.id, 3); // 3 lessons completed
  await enrollStudent(student1.id, course2.id, 1);
  await enrollStudent(student2.id, course3.id, 4);
  await enrollStudent(student2.id, course6.id, 0);
  console.log('  ✔ Enrollments');

  // ─── XP Logs ──────────────────────────────────────────────────────────────
  await prisma.xpLog.createMany({
    skipDuplicates: true,
    data: [
      { userId: student1.id, xpAmount: 50, sourceType: 'lesson_complete', description: 'Completed lesson', earnedAt: ago(10) },
      { userId: student1.id, xpAmount: 50, sourceType: 'lesson_complete', description: 'Completed lesson', earnedAt: ago(9) },
      { userId: student1.id, xpAmount: 100, sourceType: 'quiz_pass', description: 'Passed quiz', earnedAt: ago(8) },
      { userId: student1.id, xpAmount: 50, sourceType: 'lesson_complete', description: 'Completed lesson', earnedAt: ago(5) },
      { userId: student2.id, xpAmount: 50, sourceType: 'lesson_complete', description: 'Completed lesson', earnedAt: ago(3) },
      { userId: student2.id, xpAmount: 75, sourceType: 'lesson_complete', description: 'Completed lesson', earnedAt: ago(2) },
    ],
  });
  console.log('  ✔ XP Logs');

  console.log('\n✅  Seed complete!\n');
  console.log('Test accounts (all passwords: Password123!):');
  console.log('  Student 1 : student@unilearn.al');
  console.log('  Student 2 : student2@unilearn.al');
  console.log('  Instructor: prof.arben@unilearn.al');
  console.log('  Instructor: prof.blerta@unilearn.al');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertCourse(opts: {
  slug: string;
  title: string;
  description: string;
  level: string;
  language: string;
  isPremium: boolean;
  price: number | null;
  authorId: string;
  categoryId: string;
  chapters: Array<{
    title: string;
    lessons: Array<{ title: string; type: string; duration: number | null; free: boolean }>;
  }>;
}) {
  const existing = await prisma.course.findUnique({ where: { slug: opts.slug } });
  if (existing) return existing;

  return prisma.course.create({
    data: {
      slug: opts.slug,
      title: opts.title,
      description: opts.description,
      level: opts.level,
      language: opts.language,
      isPremium: opts.isPremium,
      price: opts.price,
      status: 'published',
      authorId: opts.authorId,
      categoryId: opts.categoryId,
      publishedAt: ago(Math.floor(Math.random() * 60) + 5),
      createdAt: ago(70),
      updatedAt: ago(1),
      chapters: {
        create: opts.chapters.map((ch, ci) => ({
          title: ch.title,
          orderIndex: ci,
          createdAt: ago(70),
          lessons: {
            create: ch.lessons.map((l, li) => ({
              title: l.title,
              lessonType: l.type,
              orderIndex: li,
              durationSeconds: l.duration,
              isFreePreview: l.free,
              createdAt: ago(70),
              lessonContents: {
                create: [
                  {
                    contentType: l.type === 'video' ? 'video' : l.type === 'exercise' ? 'exercise' : 'text',
                    body: l.type === 'text'
                      ? `This lesson covers **${l.title}**.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\n## Key Points\n- Point one about ${l.title}\n- Point two with example code\n- Summary and next steps`
                      : null,
                    mediaUrl: l.type === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : null,
                    orderIndex: 0,
                    createdAt: ago(70),
                  },
                ],
              },
            })),
          },
        })),
      },
    },
  });
}

async function enrollStudent(userId: string, courseId: string, completedCount: number) {
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return;

  const lessons = await prisma.lesson.findMany({
    where: { chapter: { courseId } },
    orderBy: [{ chapter: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
  });

  const totalLessons = lessons.length;
  const toComplete = lessons.slice(0, completedCount);
  const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      status: 'active',
      enrolledAt: ago(20),
      courseProgress: {
        create: {
          totalLessons,
          completedLessons: completedCount,
          progressPercent,
          lastAccessedAt: ago(1),
          updatedAt: ago(1),
        },
      },
    },
  });

  if (toComplete.length > 0) {
    await prisma.lessonProgress.createMany({
      data: toComplete.map((l) => ({
        enrollmentId: enrollment.id,
        lessonId: l.id,
        isCompleted: true,
        completedAt: ago(Math.floor(Math.random() * 10) + 1),
      })),
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
