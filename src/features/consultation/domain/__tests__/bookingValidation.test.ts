import { validateSlotForBooking, canCancelBooking, getSlotUnavailableReason } from '@/features/consultation/domain/bookingValidation';
import type { Booking, TimeSlot } from '@/features/consultation/domain/types';
import { ValidationError, ConflictError } from '@/core/errors/AppError';

const futureSlot: TimeSlot = {
  id: 'slot-1',
  doctorId: 'doc-1',
  date: '2099-01-15',
  startTime: '10:00',
  endTime: '10:30',
  dateTime: '2099-01-15T10:00:00',
  status: 'available',
};

const expiredSlot: TimeSlot = {
  ...futureSlot,
  id: 'slot-2',
  dateTime: '2020-01-15T10:00:00',
  status: 'expired',
};

describe('bookingValidation', () => {
  it('classifies expired slots as expired even if status is available', () => {
    expect(
      getSlotUnavailableReason({ ...futureSlot, dateTime: '2020-01-15T10:00:00', status: 'available' }),
    ).toBe('expired');
  });

  it('classifies booked slots as booked', () => {
    expect(getSlotUnavailableReason({ ...futureSlot, status: 'booked' })).toBe('booked');
  });

  it('classifies the user\'s own booking as a duplicate', () => {
    const bookings: Booking[] = [{
      id: 'b1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Test',
      slotId: 'slot-1',
      date: '2099-01-15',
      startTime: '10:00',
      endTime: '10:30',
      consultationFee: 500,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }];
    expect(getSlotUnavailableReason(futureSlot, bookings)).toBe('duplicate');
  });
  it('rejects expired slots', () => {
    expect(() => validateSlotForBooking(expiredSlot, [])).toThrow(ValidationError);
  });

  it('rejects booked slots', () => {
    expect(() =>
      validateSlotForBooking({ ...futureSlot, status: 'booked' }, []),
    ).toThrow(ConflictError);
  });

  it('rejects duplicate bookings', () => {
    const bookings: Booking[] = [{
      id: 'b1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Test',
      slotId: 'slot-1',
      date: '2099-01-15',
      startTime: '10:00',
      endTime: '10:30',
      consultationFee: 500,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }];
    expect(() => validateSlotForBooking(futureSlot, bookings)).toThrow(ConflictError);
  });

  it('allows cancellation when within window', () => {
    const booking: Booking = {
      id: 'b1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Test',
      slotId: 'slot-1',
      date: '2099-06-15',
      startTime: '10:00',
      endTime: '10:30',
      consultationFee: 500,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    expect(canCancelBooking(booking).allowed).toBe(true);
  });

  it('rejects cancellation for already cancelled', () => {
    const booking: Booking = {
      id: 'b1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Test',
      slotId: 'slot-1',
      date: '2099-06-15',
      startTime: '10:00',
      endTime: '10:30',
      consultationFee: 500,
      status: 'cancelled',
      createdAt: new Date().toISOString(),
    };
    expect(canCancelBooking(booking).allowed).toBe(false);
  });
});
