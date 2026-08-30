import {
  formatAppointmentDate,
  isUpcomingBooking,
  BOOKING_STATUS_LABELS,
} from '@/features/consultation/domain/bookingDisplay';
import type { Booking } from '@/features/consultation/domain/types';

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sharma',
    slotId: 'slot-1',
    date: '2099-12-01',
    startTime: '10:00',
    endTime: '10:30',
    consultationFee: 500,
    status: 'confirmed',
    createdAt: '2099-11-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('bookingDisplay', () => {
  it('labels confirmed status', () => {
    expect(BOOKING_STATUS_LABELS.confirmed).toBe('Confirmed');
  });

  it('formats appointment date', () => {
    expect(formatAppointmentDate('2099-12-01')).toContain('2099');
  });

  it('treats cancelled bookings as not upcoming', () => {
    expect(isUpcomingBooking(booking({ status: 'cancelled' }))).toBe(false);
  });

  it('treats future confirmed bookings as upcoming', () => {
    expect(isUpcomingBooking(booking())).toBe(true);
  });
});
