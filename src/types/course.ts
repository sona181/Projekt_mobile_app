export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CourseAuthorSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: string;
  isPremium: boolean;
  price: number | null;
  thumbnailUrl: string | null;
  language: string;
  publishedAt: string | null;
  category: CourseCategory | null;
  author: CourseAuthorSummary;
  stats: {
    enrollments: number;
    reviews: number;
    chapters: number;
    avgRating: number | null;
  };
  isEnrolled: boolean;
}

export interface LessonSummary {
  id: string;
  title: string;
  lessonType: string;
  orderIndex: number;
  durationSeconds: number | null;
  isFreePreview: boolean;
}

export interface ChapterWithLessons {
  id: string;
  title: string;
  orderIndex: number;
  lessons: LessonSummary[];
}

export interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { displayName: string; avatarUrl: string | null };
}

export interface CourseDetail extends CourseSummary {
  chapters: ChapterWithLessons[];
  recentReviews: CourseReview[];
  avgRating: number | null;
  enrollment: {
    id: string;
    status: string;
    enrolledAt: string;
    progress: {
      totalLessons: number;
      completedLessons: number;
      progressPercent: number;
    } | null;
  } | null;
}

export interface CourseListResponse {
  data: CourseSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface EnrollmentSummary {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  progress: {
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
  } | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    level: string;
    language: string;
    isPremium: boolean;
    chaptersCount: number;
    category: CourseCategory | null;
    author: CourseAuthorSummary;
  };
}
