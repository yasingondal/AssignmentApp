import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { getDoctorsPage } from '@/features/consultation/data/doctorPagination';
import { getDoctorById } from '@/features/consultation/data/doctorGenerator';
import { generateSlotsForDoctor, getSlotById, markSlotBooked, isSlotBooked } from '@/features/consultation/data/slotGenerator';
import { ConflictError, ValidationError } from '@/core/errors/AppError';
import { generateId } from '@/core/utils/id';
import type { Booking, DoctorFilters } from '@/features/consultation/domain/types';
import type { ApiRequestConfig } from '@/core/api/apiClient';

const processedIdempotencyKeys = new Set<string>();

export async function handleConsultationApi(
  endpoint: string,
  config: ApiRequestConfig,
): Promise<unknown> {
  const doctorsMatch = endpoint.match(/^\/doctors\?/);
  const doctorDetailMatch = endpoint.match(/^\/doctors\/(doc-\d+)$/);
  const slotsMatch = endpoint.match(/^\/doctors\/(doc-\d+)\/slots$/);
  const bookingsMatch = endpoint === '/bookings';
  const cancelMatch = endpoint.match(/^\/bookings\/(.+)$/);

  if (doctorsMatch) {
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const page = parseInt(params.get('page') ?? '1', 10);
    const pageSize = parseInt(params.get('pageSize') ?? '20', 10);
    const filters: DoctorFilters = JSON.parse(params.get('filters') ?? '{}') as DoctorFilters;
    return getDoctorsPage(filters, page, pageSize);
  }

  if (doctorDetailMatch) {
    const doctor = getDoctorById(doctorDetailMatch[1]!);
    if (!doctor) {
      throw new ValidationError('Doctor not found');
    }
    return doctor;
  }

  if (slotsMatch) {
    return generateSlotsForDoctor(slotsMatch[1]!);
  }

  if (bookingsMatch && config.method === 'POST') {
    const body = config.body as { doctorId: string; slotId: string; idempotencyKey: string };
    if (processedIdempotencyKeys.has(body.idempotencyKey)) {
      const bookings = await consultationRepository.getBookings();
      const existing = bookings.find(b => b.idempotencyKey === body.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const slot = getSlotById(body.slotId) ?? generateSlotsForDoctor(body.doctorId).find(s => s.id === body.slotId);
    if (!slot) {
      throw new ValidationError('Slot not found');
    }

    const localBookings = await consultationRepository.getBookings();
    const offlineHold = localBookings.find(
      b =>
        b.idempotencyKey === body.idempotencyKey &&
        (b.status === 'pending' || b.status === 'syncing'),
    );

    // Local offline hold already marks the slot booked — allow confirm sync for that key.
    if (!offlineHold && (isSlotBooked(body.slotId) || slot.status === 'booked')) {
      throw new ConflictError(
        'Slot already booked',
        'This slot is already booked. Please choose another time.',
      );
    }
    if (new Date(slot.dateTime).getTime() < Date.now()) {
      throw new ConflictError('Slot expired');
    }

    const doctor = getDoctorById(body.doctorId)!;
    markSlotBooked(body.slotId);
    processedIdempotencyKeys.add(body.idempotencyKey);

    const booking: Booking = {
      id: generateId(),
      doctorId: body.doctorId,
      doctorName: doctor.name,
      slotId: body.slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      consultationFee: doctor.consultationFee,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      idempotencyKey: body.idempotencyKey,
    };
    return booking;
  }

  if (cancelMatch && config.method === 'DELETE') {
    return { success: true, bookingId: cancelMatch[1] };
  }

  throw new ValidationError(`Unknown consultation endpoint: ${endpoint}`);
}
