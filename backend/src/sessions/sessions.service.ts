import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSessionRequestDto } from './dto/create-session-request.dto.js';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List instructors ────────────────────────────────────────────────────────
  async listInstructors() {
    const instructors = await this.prisma.user.findMany({
      where: { role: 'instructor', isActive: true },
      include: {
        profile: true,
        instructorProfile: true,
        courses: {
          where: { status: 'published' },
          select: { id: true, title: true, slug: true, language: true, level: true },
        },
      },
    });

    return instructors.map((u) => ({
      id: u.id,
      displayName: u.profile?.displayName ?? u.email,
      avatarUrl: u.profile?.avatarUrl ?? null,
      bio: u.instructorProfile?.bio ?? u.profile?.bio ?? null,
      specialties: u.instructorProfile?.specialties ?? null,
      languages: u.instructorProfile?.languages ?? null,
      hourlyRate: u.instructorProfile?.hourlyRate ?? null,
      rating: u.instructorProfile?.rating ?? null,
      isAvailable: u.instructorProfile?.isAvailable ?? true,
      courseCount: u.courses.length,
      courses: u.courses,
    }));
  }

  // ── Single instructor profile ────────────────────────────────────────────────
  async getInstructorProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        instructorProfile: true,
        courses: {
          where: { status: 'published' },
          select: { id: true, title: true, slug: true, language: true, level: true, thumbnailUrl: true },
        },
      },
    });

    if (!user || user.role !== 'instructor') throw new NotFoundException('Instructor not found');

    return {
      id: user.id,
      displayName: user.profile?.displayName ?? user.email,
      avatarUrl: user.profile?.avatarUrl ?? null,
      bio: user.instructorProfile?.bio ?? user.profile?.bio ?? null,
      specialties: user.instructorProfile?.specialties ?? null,
      languages: user.instructorProfile?.languages ?? null,
      hourlyRate: user.instructorProfile?.hourlyRate ?? null,
      rating: user.instructorProfile?.rating ?? null,
      isAvailable: user.instructorProfile?.isAvailable ?? true,
      courseCount: user.courses.length,
      courses: user.courses,
    };
  }

  // ── Request a session ────────────────────────────────────────────────────────
  async requestSession(dto: CreateSessionRequestDto) {
    const instructorUser = await this.prisma.user.findUnique({
      where: { id: dto.instructorUserId },
      include: { instructorProfile: true },
    });
    if (!instructorUser) throw new NotFoundException('Instructor not found');

    // Find or create InstructorProfile
    let instructorProfile = instructorUser.instructorProfile;
    if (!instructorProfile) {
      instructorProfile = await this.prisma.instructorProfile.create({
        data: {
          userId: instructorUser.id,
          isVerified: false,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    const startsAt = new Date(dto.scheduledAt);
    const endsAt = new Date(startsAt.getTime() + dto.durationMinutes * 60 * 1000);
    const now = new Date();

    // Create availability slot for the requested time
    const slot = await this.prisma.availabilitySlot.create({
      data: {
        instructorId: instructorProfile.id,
        startsAt,
        endsAt,
        isBooked: true,
        createdAt: now,
      },
    });

    // Create the booking
    const booking = await this.prisma.sessionBooking.create({
      data: {
        studentId: dto.studentId,
        instructorId: instructorProfile.id,
        slotId: slot.id,
        topic: dto.topic,
        status: 'pending',
        bookedAt: now,
      },
      include: {
        slot: true,
        student: { include: { profile: true } },
      },
    });

    // Notify instructor
    const studentName = booking.student.profile?.displayName ?? booking.student.email;
    await this.prisma.notification.create({
      data: {
        userId: instructorUser.id,
        type: 'session_request',
        message: `${studentName} has requested a study session: "${dto.topic}" on ${startsAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${startsAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.${dto.description ? ' Note: ' + dto.description : ''}`,
        isRead: false,
        createdAt: now,
      },
    });

    return {
      id: booking.id,
      studentId: booking.studentId,
      instructorUserId: instructorUser.id,
      topic: booking.topic,
      status: booking.status,
      scheduledAt: slot.startsAt,
      durationMinutes: dto.durationMinutes,
      bookedAt: booking.bookedAt,
    };
  }

  // ── Student's bookings ────────────────────────────────────────────────────────
  async getStudentBookings(studentId: string) {
    const bookings = await this.prisma.sessionBooking.findMany({
      where: { studentId },
      include: {
        slot: true,
        liveSession: true,
        instructorProfile: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
      orderBy: { slot: { startsAt: 'desc' } },
    });

    return bookings.map((b) => ({
      id: b.id,
      topic: b.topic,
      status: b.status,
      scheduledAt: b.slot.startsAt,
      endsAt: b.slot.endsAt,
      bookedAt: b.bookedAt,
      instructor: {
        id: b.instructorProfile.user.id,
        displayName: b.instructorProfile.user.profile?.displayName ?? b.instructorProfile.user.email,
        avatarUrl: b.instructorProfile.user.profile?.avatarUrl ?? null,
      },
      liveSession: b.liveSession
        ? {
            joinUrl: b.liveSession.joinUrl,
            status: b.liveSession.status,
            startedAt: b.liveSession.startedAt,
          }
        : null,
    }));
  }

  // ── Instructor's bookings ─────────────────────────────────────────────────────
  async getInstructorBookings(instructorUserId: string) {
    const instrUser = await this.prisma.user.findUnique({
      where: { id: instructorUserId },
      include: { instructorProfile: true },
    });
    if (!instrUser?.instructorProfile) return [];

    const bookings = await this.prisma.sessionBooking.findMany({
      where: { instructorId: instrUser.instructorProfile.id },
      include: {
        slot: true,
        liveSession: true,
        student: { include: { profile: true } },
      },
      orderBy: { slot: { startsAt: 'asc' } },
    });

    return bookings.map((b) => ({
      id: b.id,
      topic: b.topic,
      status: b.status,
      scheduledAt: b.slot.startsAt,
      endsAt: b.slot.endsAt,
      bookedAt: b.bookedAt,
      student: {
        id: b.student.id,
        displayName: b.student.profile?.displayName ?? b.student.email,
        avatarUrl: b.student.profile?.avatarUrl ?? null,
        email: b.student.email,
      },
      liveSession: b.liveSession
        ? {
            joinUrl: b.liveSession.joinUrl,
            status: b.liveSession.status,
            startedAt: b.liveSession.startedAt,
          }
        : null,
    }));
  }

  // ── Update booking status ─────────────────────────────────────────────────────
  async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
    const booking = await this.prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
        student: { include: { profile: true } },
        instructorProfile: { include: { user: { include: { profile: true } } } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.sessionBooking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
      },
    });

    const instructorName = booking.instructorProfile.user.profile?.displayName ?? 'Your instructor';
    const date = booking.slot.startsAt.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    const time = booking.slot.startsAt.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

    if (status === 'confirmed') {
      await this.prisma.notification.create({
        data: {
          userId: booking.studentId,
          type: 'session_confirmed',
          message: `Great news! ${instructorName} confirmed your session "${booking.topic}" scheduled for ${date} at ${time}. Get ready to learn!`,
          isRead: false,
          createdAt: new Date(),
        },
      });
    } else if (status === 'cancelled') {
      await this.prisma.notification.create({
        data: {
          userId: booking.studentId,
          type: 'session_cancelled',
          message: `Your session "${booking.topic}" on ${date} at ${time} was unfortunately cancelled. You can request a new session anytime.`,
          isRead: false,
          createdAt: new Date(),
        },
      });
      // Mark slot as not booked
      await this.prisma.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });
    }

    return updated;
  }

  // ── Start call (instructor) ───────────────────────────────────────────────────
  async startCall(bookingId: string) {
    const booking = await this.prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
        student: { include: { profile: true } },
        instructorProfile: { include: { user: { include: { profile: true } } } },
        liveSession: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const roomName = `UniLearn-${bookingId.replace(/-/g, '').slice(0, 12)}`;
    const joinUrl = `https://meet.jit.si/${roomName}`;
    const now = new Date();

    let liveSession = booking.liveSession;
    if (!liveSession) {
      liveSession = await this.prisma.liveSession.create({
        data: {
          bookingId,
          externalMeetingId: roomName,
          joinUrl,
          provider: 'jitsi',
          status: 'live',
          startedAt: now,
        },
      });
    } else {
      liveSession = await this.prisma.liveSession.update({
        where: { id: liveSession.id },
        data: { status: 'live', startedAt: now, joinUrl },
      });
    }

    const instructorName = booking.instructorProfile.user.profile?.displayName ?? 'Your instructor';
    const date = booking.slot.startsAt.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    const time = booking.slot.startsAt.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

    await this.prisma.notification.create({
      data: {
        userId: booking.studentId,
        type: 'call_started',
        message: `${instructorName} has started your session "${booking.topic}"! Join now — the call is live. Session: ${date} at ${time}.`,
        isRead: false,
        createdAt: now,
      },
    });

    return { joinUrl, roomName, status: 'live' };
  }

  // ── User notifications ─────────────────────────────────────────────────────────
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }
}
