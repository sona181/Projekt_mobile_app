import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();

  // ── Instructor ──────────────────────────────────────────────────────────────
  let instructor = await prisma.user.findFirst({ where: { email: 'prof@unilearn.al' } });
  if (!instructor) {
    const hash = await bcrypt.hash('UniLearn@2026', 10);
    instructor = await prisma.user.create({
      data: {
        email: 'prof@unilearn.al',
        passwordHash: hash,
        role: 'instructor',
        isActive: true,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.userProfile.create({
      data: {
        userId: instructor.id,
        displayName: 'UniLearn Team',
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('Created instructor: prof@unilearn.al / UniLearn@2026');
  } else {
    console.log('Using existing instructor:', instructor.email);
  }

  // ── Category ────────────────────────────────────────────────────────────────
  const category = await prisma.courseCategory.findFirst({
    where: {
      OR: [
        { slug: 'programming' },
        { name: { contains: 'Program', mode: 'insensitive' } },
        { name: { contains: 'Computer', mode: 'insensitive' } },
      ],
    },
  });

  // ── Course definitions ───────────────────────────────────────────────────────
  const COURSES = [
    {
      slug: 'java-basics',
      title: 'Java Programming Basics',
      description:
        'Master Java fundamentals: variables, OOP, exceptions, and collections. Build real programs from day one.',
      level: 'beginner',
      language: 'java',
      chapters: [
        {
          title: 'Java Fundamentals',
          lessons: [
            { title: 'What is Java?', free: true },
            { title: 'Variables & Data Types', free: false },
            { title: 'Operators & Expressions', free: false },
            { title: 'Control Flow: if, switch', free: false },
          ],
        },
        {
          title: 'Methods & Arrays',
          lessons: [
            { title: 'Defining & Calling Methods', free: false },
            { title: 'Arrays & Loops', free: false },
            { title: 'String Manipulation', free: false },
          ],
        },
        {
          title: 'Object-Oriented Programming',
          lessons: [
            { title: 'Classes & Objects', free: false },
            { title: 'Inheritance', free: false },
            { title: 'Interfaces & Polymorphism', free: false },
            { title: 'Exception Handling', free: false },
          ],
        },
      ],
    },
    {
      slug: 'c-fundamentals',
      title: 'C Programming Fundamentals',
      description:
        'Learn C from scratch: memory management, pointers, and system-level programming concepts.',
      level: 'beginner',
      language: 'c',
      chapters: [
        {
          title: 'Getting Started with C',
          lessons: [
            { title: 'Introduction to C', free: true },
            { title: 'Variables, Types & printf', free: false },
            { title: 'Operators & Input', free: false },
          ],
        },
        {
          title: 'Control Flow & Functions',
          lessons: [
            { title: 'if/else and switch', free: false },
            { title: 'Loops: for, while, do-while', free: false },
            { title: 'Functions & Scope', free: false },
            { title: 'Recursion', free: false },
          ],
        },
        {
          title: 'Pointers & Memory',
          lessons: [
            { title: 'Arrays & Strings', free: false },
            { title: 'Pointers Explained', free: false },
            { title: 'Dynamic Memory with malloc', free: false },
            { title: 'Structs & Unions', free: false },
          ],
        },
      ],
    },
    {
      slug: 'python-essentials',
      title: 'Python Programming Essentials',
      description:
        'Python for beginners: scripting, data structures, functions, and real-world mini projects.',
      level: 'beginner',
      language: 'python',
      chapters: [
        {
          title: 'Python Basics',
          lessons: [
            { title: 'Introduction to Python', free: true },
            { title: 'Variables, Types & Print', free: false },
            { title: 'Lists, Tuples & Dicts', free: false },
            { title: 'Strings & Formatting', free: false },
          ],
        },
        {
          title: 'Functions & Modules',
          lessons: [
            { title: 'Defining Functions', free: false },
            { title: 'Lambda & List Comprehension', free: false },
            { title: 'Modules & Packages', free: false },
            { title: 'File I/O', free: false },
          ],
        },
        {
          title: 'Real-World Python',
          lessons: [
            { title: 'Error Handling', free: false },
            { title: 'Working with APIs', free: false },
            { title: 'Data Processing', free: false },
            { title: 'Mini Project: Student Grade Calculator', free: false },
          ],
        },
      ],
    },
  ];

  // ── Seed each course ─────────────────────────────────────────────────────────
  for (const def of COURSES) {
    const existing = await prisma.course.findUnique({ where: { slug: def.slug } });
    if (existing) {
      console.log(`  Already exists: ${def.title}`);
      continue;
    }

    const course = await prisma.course.create({
      data: {
        authorId: instructor.id,
        categoryId: category?.id ?? null,
        title: def.title,
        slug: def.slug,
        description: def.description,
        level: def.level,
        language: def.language,
        status: 'published',
        isPremium: false,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    for (let ci = 0; ci < def.chapters.length; ci++) {
      const chDef = def.chapters[ci];
      const chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          title: chDef.title,
          orderIndex: ci,
          createdAt: now,
        },
      });

      for (let li = 0; li < chDef.lessons.length; li++) {
        await prisma.lesson.create({
          data: {
            chapterId: chapter.id,
            title: chDef.lessons[li].title,
            lessonType: 'text',
            orderIndex: li,
            isFreePreview: chDef.lessons[li].free,
            createdAt: now,
          },
        });
      }
    }

    console.log(`  Created: ${def.title}`);
  }

  console.log('\nDone! Run the app to see the courses in Browse.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
