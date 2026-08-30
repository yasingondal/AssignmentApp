import { ConflictError, ValidationError } from '@/core/errors/AppError';
import { isSlotExpired } from '@/core/utils/dateGrouping';
import type { Booking, TimeSlot } from '@/features/consultation/domain/types';

export type SlotUnavailableReason = 'expired' | 'booked' | 'duplicate';

const ACTIVE_BOOKING_STATUSES = new Set(['pending', 'syncing', 'confirmed']);

export function findActiveBookingForSlot(
  slotId: string,
  existingBookings: Booking[],
): Booking | undefined {
  return existingBookings.find(
    b => b.slotId === slotId && ACTIVE_BOOKING_STATUSES.has(b.status),
  );
}

export function getSlotUnavailableReason(
  slot: TimeSlot,
  existingBookings: Booking[] = [],
): SlotUnavailableReason | null {
  if (slot.status === 'expired' || isSlotExpired(slot.dateTime)) {
    return 'expired';
  }
  if (findActiveBookingForSlot(slot.id, existingBookings)) {
    return 'duplicate';
  }
  if (slot.status === 'booked' || slot.status === 'conflict') {
    return 'booked';
  }
  return null;
}

export function validateSlotForBooking(
  slot: TimeSlot,
  existingBookings: Booking[],
): void {
  if (slot.status === 'expired' || isSlotExpired(slot.dateTime)) {
    throw new ValidationError('Slot has expired', 'This time slot has expired and cannot be booked.');
  }

  const duplicate = findActiveBookingForSlot(slot.id, existingBookings);
  if (duplicate) {
    throw new ConflictError(
      'Duplicate booking',
      'You have already booked this slot. Check My Visits for the existing appointment.',
    );
  }

  if (slot.status === 'booked') {
    throw new ConflictError(
      'Slot already booked',
      'This slot is already booked. Please choose another time.',
    );
  }

  if (slot.status === 'conflict') {
    throw new ConflictError('Slot conflict', 'This slot is no longer available.');
  }
}

export function canCancelBooking(booking: Booking): { allowed: boolean; reason?: string } {
  if (booking.status === 'cancelled') {
    return { allowed: false, reason: 'Booking is already cancelled.' };
  }
  if (booking.status === 'expired') {
    return { allowed: false, reason: 'Cannot cancel an expired consultation.' };
  }
  const appointmentTime = new Date(`${booking.date}T${booking.startTime}`).getTime();
  const hoursUntil = (appointmentTime - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 2) {
    return { allowed: false, reason: 'Cancellation window has expired (2 hours before appointment).' };
  }
  return { allowed: true };
}
