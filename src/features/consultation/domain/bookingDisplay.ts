import type { Booking, BookingStatus } from '@/features/consultation/domain/types';
import { formatDate } from '@/core/utils/dateGrouping';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Awaiting sync',
  syncing: 'Syncing',
  confirmed: 'Confirmed',
  failed: 'Failed',
  conflict: 'Conflict',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#C9A227',
  syncing: '#3D6B8E',
  confirmed: '#1B7A5A',
  failed: '#C0392B',
  conflict: '#E76F51',
  expired: '#8A938E',
  cancelled: '#8A938E',
};

export function getAppointmentDateTime(booking: Booking): Date {
  return new Date(`${booking.date}T${booking.startTime}`);
}

export function formatAppointmentDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return formatDate(date);
  }
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatBookedOn(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getVisitTiming(booking: Booking): string {
  const start = getAppointmentDateTime(booking).getTime();
  if (Number.isNaN(start)) {
    return booking.date;
  }

  const diffMs = start - Date.now();
  const hours = diffMs / (1000 * 60 * 60);

  if (booking.status === 'cancelled') {
    return 'Visit cancelled';
  }
  if (booking.status === 'expired' || hours < -2) {
    return 'Visit completed / past';
  }
  if (hours < 0) {
    return 'In progress or just passed';
  }
  if (hours < 2) {
    return 'Starts soon';
  }
  if (hours < 24) {
    return `In ${Math.max(1, Math.round(hours))} hours`;
  }
  const days = Math.round(hours / 24);
  return `In ${days} day${days === 1 ? '' : 's'}`;
}

export function isUpcomingBooking(booking: Booking): boolean {
  if (booking.status === 'cancelled' || booking.status === 'failed' || booking.status === 'expired') {
    return false;
  }
  return getAppointmentDateTime(booking).getTime() >= Date.now() - 30 * 60 * 1000;
}
