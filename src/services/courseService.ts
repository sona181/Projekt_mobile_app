import { api } from './api';
import type {
  CourseCategory,
  CourseDetail,
  CourseListResponse,
  EnrollmentSummary,
} from '../types/course';

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
  language?: string;
  isPremium?: boolean;
}

export const courseService = {
  list: (params?: CourseListParams) =>
    api.get<CourseListResponse>('/courses', { params }).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<CourseDetail>(`/courses/${slug}`).then((r) => r.data),

  listCategories: () =>
    api.get<CourseCategory[]>('/courses/categories').then((r) => r.data),

  enroll: (courseId: string) =>
    api.post('/enrollments', { courseId }).then((r) => r.data),

  myEnrollments: () =>
    api.get<EnrollmentSummary[]>('/enrollments/me').then((r) => r.data),
};
