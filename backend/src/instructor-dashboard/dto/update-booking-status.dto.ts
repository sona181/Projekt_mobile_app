export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export class UpdateBookingStatusDto {
  status: BookingStatus;
}
