export class CreateSessionRequestDto {
  studentId!: string;
  instructorUserId!: string;
  scheduledAt!: string; // ISO date string
  durationMinutes!: number;
  topic!: string;
  description?: string;
}
