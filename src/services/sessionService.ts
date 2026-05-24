import { api } from './api';

export interface InstructorSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string | null;
  languages: string | null;
  hourlyRate: string | null;
  rating: string | null;
  isAvailable: boolean;
  courseCount?: number;
  courses?: { id: string; title: string; slug: string; language: string; level: string }[];
}

export interface SessionBooking {
  id: string;
  topic: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  scheduledAt: string;
  endsAt: string;
  bookedAt: string;
  instructor?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  student?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email: string;
  };
  liveSession: {
    joinUrl: string | null;
    status: string;
    startedAt: string | null;
  } | null;
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const sessionService = {
  listInstructors: () =>
    api.get<InstructorSummary[]>('/sessions/instructors').then((r) => r.data),

  getInstructor: (userId: string) =>
    api.get<InstructorSummary>(`/sessions/instructors/${userId}`).then((r) => r.data),

  requestSession: (data: {
    studentId: string;
    instructorUserId: string;
    scheduledAt: string;
    durationMinutes: number;
    topic: string;
    description?: string;
  }) => api.post('/sessions/request', data).then((r) => r.data),

  getStudentBookings: (studentId: string) =>
    api.get<SessionBooking[]>(`/sessions/student/${studentId}`).then((r) => r.data),

  getInstructorBookings: (instructorUserId: string) =>
    api.get<SessionBooking[]>(`/sessions/instructor/${instructorUserId}/bookings`).then((r) => r.data),

  updateStatus: (bookingId: string, status: 'confirmed' | 'cancelled') =>
    api.patch(`/sessions/${bookingId}/status`, { status }).then((r) => r.data),

  startCall: (bookingId: string) =>
    api.post<{ joinUrl: string; roomName: string; status: string }>(
      `/sessions/${bookingId}/start-call`,
      {},
    ).then((r) => r.data),

  getNotifications: (userId: string) =>
    api.get<AppNotification[]>(`/sessions/notifications/${userId}`).then((r) => r.data),

  markNotificationsRead: (userId: string) =>
    api.patch(`/sessions/notifications/${userId}/read`, {}).then((r) => r.data),
};
