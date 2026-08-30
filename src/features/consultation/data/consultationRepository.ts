import { generateId } from '@/core/utils/id';
import { apiClient } from '@/core/api/apiClient';
import type { PaginatedResponse } from '@/core/api/types';
import { cache } from '@/core/storage/cache';
import { ConflictError, ValidationError } from '@/core/errors/AppError';
import { networkService } from '@/core/network/networkService';
import { useSyncQueueStore } from '@/core/sync/syncQueue';
import { validateSlotForBooking, canCancelBooking } from '@/features/consultation/domain/bookingValidation';
import { getDoctorsPage } from '@/features/consultation/data/doctorPagination';
import {
  getDoctorById,
} from '@/features/consultation/data/doctorGenerator';
import {
  generateSlotsForDoctor,
  getSlotById,
  markSlotBooked,
} from '@/features/consultation/data/slotGenerator';
import type {
  Booking,
  CreateBookingPayload,
  Doctor,
  DoctorFilters,
  TimeSlot,
} from '@/features/consultation/domain/types';
import { storage } from '@/core/storage/storage';

const BOOKINGS_KEY = 'consultation_bookings';

class ConsultationRepository {
  private bookings: Booking[] = [];
  private hydrated = false;

  async hydrate(): Promise<void> {
    if (this.hydrated) {
      return;
    }
    const saved = await storage.get<Booking[]>(BOOKINGS_KEY);
    this.bookings = saved ?? [];
    this.hydrated = true;
  }

  /** @internal For testing only */
  async _resetForTests(): Promise<void> {
    this.bookings = [];
    this.hydrated = true;
    await storage.remove(BOOKINGS_KEY);
  }

  private async persistBookings(): Promise<void> {
    await storage.set(BOOKINGS_KEY, this.bookings);
  }

  async getDoctors(
    filters: DoctorFilters,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<Doctor>> {
    const cacheKey = `doctors:${JSON.stringify(filters)}:${page}:${pageSize}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<PaginatedResponse<Doctor>>(cacheKey);
      if (cached) {
        return cached;
      }
      return this.getDoctorsLocal(filters, page, pageSize);
    }

    try {
      const result = await apiClient.get<PaginatedResponse<Doctor>>(
        `/doctors?page=${page}&pageSize=${pageSize}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
      );
      await cache.set(cacheKey, result);
      return result;
    } catch {
      const cached = await cache.getFreshOrStale<PaginatedResponse<Doctor>>(cacheKey);
      if (cached) {
        return cached;
      }
      return this.getDoctorsLocal(filters, page, pageSize);
    }
  }

  getDoctorsLocal(
    filters: DoctorFilters,
    page: number,
    pageSize: number,
  ): PaginatedResponse<Doctor> {
    return getDoctorsPage(filters, page, pageSize);
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    const cacheKey = `doctor:${id}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<Doctor>(cacheKey);
      if (cached) {
        return cached;
      }
      return getDoctorById(id) ?? null;
    }

    try {
      const doctor = await apiClient.get<Doctor>(`/doctors/${id}`);
      await cache.set(cacheKey, doctor);
      return doctor;
    } catch {
      const cached = await cache.getFreshOrStale<Doctor>(cacheKey);
      if (cached) {
        return cached;
      }
      return getDoctorById(id) ?? null;
    }
  }

  async getSlots(doctorId: string): Promise<TimeSlot[]> {
    const cacheKey = `slots:${doctorId}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<TimeSlot[]>(cacheKey);
      return cached ?? generateSlotsForDoctor(doctorId);
    }

    try {
      const slots = await apiClient.get<TimeSlot[]>(`/doctors/${doctorId}/slots`);
      await cache.set(cacheKey, slots, 5 * 60 * 1000);
      return slots;
    } catch {
      const cached = await cache.getFreshOrStale<TimeSlot[]>(cacheKey);
      return cached ?? generateSlotsForDoctor(doctorId);
    }
  }

  async getBookings(): Promise<Booking[]> {
    await this.hydrate();
    return [...this.bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getBookingById(id: string): Promise<Booking | null> {
    await this.hydrate();
    return this.bookings.find(b => b.id === id) ?? null;
  }

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    await this.hydrate();

    const doctor = getDoctorById(payload.doctorId);
    const slot = getSlotById(payload.slotId) ?? (await this.getSlots(payload.doctorId)).find(s => s.id === payload.slotId);

    if (!doctor || !slot) {
      throw new ValidationError('Invalid booking data');
    }

    const existingByKey = this.bookings.find(
      b => b.idempotencyKey === payload.idempotencyKey && (b.status === 'confirmed' || b.status === 'pending'),
    );
    if (existingByKey) {
      return existingByKey;
    }

    validateSlotForBooking(slot, this.bookings);

    if (!networkService.isOnline()) {
      const booking: Booking = {
        id: generateId(),
        doctorId: doctor.id,
        doctorName: doctor.name,
        slotId: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        consultationFee: doctor.consultationFee,
        status: 'pending',
        createdAt: new Date().toISOString(),
        idempotencyKey: payload.idempotencyKey,
      };
      markSlotBooked(slot.id);
      this.bookings.push(booking);
      await this.persistBookings();
      useSyncQueueStore.getState().enqueue(
        'CREATE_BOOKING',
        payload as unknown as Record<string, unknown>,
        payload.idempotencyKey,
      );
      return booking;
    }

    return this.syncBooking(payload as unknown as Record<string, unknown>, payload.idempotencyKey);
  }

  async syncBooking(payload: Record<string, unknown>, idempotencyKey: string): Promise<Booking> {
    await this.hydrate();

    const existingConfirmed = this.bookings.find(
      b => b.idempotencyKey === idempotencyKey && b.status === 'confirmed',
    );
    if (existingConfirmed) {
      return existingConfirmed;
    }

    const doctorId = payload.doctorId as string;
    const slotId = payload.slotId as string;
    const doctor = getDoctorById(doctorId)!;
    const slots = await this.getSlots(doctorId);
    const slot = slots.find(s => s.id === slotId)!;

    const pendingIdx = this.bookings.findIndex(b => b.idempotencyKey === idempotencyKey);
    if (pendingIdx >= 0) {
      this.bookings[pendingIdx] = { ...this.bookings[pendingIdx]!, status: 'syncing' };
      await this.persistBookings();
    }

    const others = this.bookings.filter(b => b.idempotencyKey !== idempotencyKey);
    // Own offline hold may already mark the slot booked locally — still allow sync for this key.
    if (pendingIdx < 0) {
      validateSlotForBooking(slot, others);
    } else {
      const duplicate = others.find(
        b => b.slotId === slotId && (b.status === 'pending' || b.status === 'syncing' || b.status === 'confirmed'),
      );
      if (duplicate) {
        throw new ConflictError(
          'Duplicate booking',
          'You have already booked this slot. Check My Visits for the existing appointment.',
        );
      }
    }
    try {
      const result = await apiClient.post<Booking>('/bookings', { doctorId, slotId, idempotencyKey });
      markSlotBooked(slotId);
      const idx = this.bookings.findIndex(b => b.idempotencyKey === idempotencyKey);
      if (idx >= 0) {
        this.bookings[idx] = { ...result, status: 'confirmed', idempotencyKey };
      } else {
        this.bookings.push({ ...result, status: 'confirmed', idempotencyKey });
      }
      await this.persistBookings();
      return this.bookings.find(b => b.idempotencyKey === idempotencyKey)!;
    } catch (error) {
      const failureStatus = error instanceof ConflictError ? 'conflict' : 'failed';
      const failureReason = error instanceof Error ? error.message : 'Unknown error';
      const idx = this.bookings.findIndex(b => b.idempotencyKey === idempotencyKey);
      if (idx >= 0) {
        this.bookings[idx] = {
          ...this.bookings[idx]!,
          status: failureStatus,
          failureReason,
        };
      } else {
        this.bookings.push({
          id: generateId(),
          doctorId,
          doctorName: doctor.name,
          slotId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationFee: doctor.consultationFee,
          status: failureStatus,
          createdAt: new Date().toISOString(),
          idempotencyKey,
          failureReason,
        });
      }
      await this.persistBookings();
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    await this.hydrate();
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    const { allowed, reason } = canCancelBooking(booking);
    if (!allowed) {
      throw new ValidationError(reason ?? 'Cannot cancel');
    }

    if (!networkService.isOnline()) {
      booking.status = 'cancelled';
      await this.persistBookings();
      useSyncQueueStore.getState().enqueue('CANCEL_BOOKING', { bookingId }, `cancel-${bookingId}`);
      return booking;
    }

    return this.syncCancellation(bookingId, `cancel-${bookingId}`);
  }

  async syncCancellation(bookingId: string, _idempotencyKey: string): Promise<Booking> {
    await this.hydrate();
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    await apiClient.delete(`/bookings/${bookingId}`);
    booking.status = 'cancelled';
    await this.persistBookings();
    return booking;
  }
}

export const consultationRepository = new ConsultationRepository();
