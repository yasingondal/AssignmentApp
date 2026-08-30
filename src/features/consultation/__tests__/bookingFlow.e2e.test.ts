/**
 * E2E-style integration test for consultation booking flow.
 * Tests the full business logic path: doctor → slot → book → list.
 */
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { clearSlotCache } from '@/features/consultation/data/slotGenerator';
import { generateId } from '@/core/utils/id';
import { initMockApi } from '@/core/api/mockApiRouter';

jest.mock('@/core/network/networkService', () => ({
  networkService: {
    isOnline: jest.fn(() => true),
    init: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    getStatus: jest.fn(() => 'online'),
  },
}));

describe('Consultation Booking E2E Flow', () => {
  beforeAll(() => {
    initMockApi();
  });

  beforeEach(async () => {
    clearSlotCache();
    await consultationRepository._resetForTests();
  });

  it('completes doctor → slot → book → upcoming flow', async () => {
    const doctors = await consultationRepository.getDoctors({}, 1, 5);
    expect(doctors.data.length).toBeGreaterThan(0);

    const doctor = doctors.data[0]!;
    const doctorDetail = await consultationRepository.getDoctorById(doctor.id);
    expect(doctorDetail).not.toBeNull();
    expect(doctorDetail!.id).toBe(doctor.id);

    const slots = await consultationRepository.getSlots(doctor.id);
    const availableSlot = slots.find(s => s.status === 'available');
    expect(availableSlot).toBeDefined();

    const booking = await consultationRepository.createBooking({
      doctorId: doctor.id,
      slotId: availableSlot!.id,
      idempotencyKey: generateId(),
    });
    expect(booking.status).toBe('confirmed');
    expect(booking.doctorId).toBe(doctor.id);

    const bookings = await consultationRepository.getBookings();
    const found = bookings.find(b => b.id === booking.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe('confirmed');
  });

  it('prevents double booking the same slot', async () => {
    const doctors = await consultationRepository.getDoctors({}, 1, 1);
    const doctor = doctors.data[0]!;
    const slots = await consultationRepository.getSlots(doctor.id);
    const slot = slots.find(s => s.status === 'available')!;

    const key = generateId();
    const first = await consultationRepository.createBooking({
      doctorId: doctor.id,
      slotId: slot.id,
      idempotencyKey: key,
    });
    expect(first.status).toBe('confirmed');

    const sameKey = await consultationRepository.createBooking({
      doctorId: doctor.id,
      slotId: slot.id,
      idempotencyKey: key,
    });
    expect(sameKey.id).toBe(first.id);

    await expect(
      consultationRepository.createBooking({
        doctorId: doctor.id,
        slotId: slot.id,
        idempotencyKey: generateId(),
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT_ERROR',
    });
  });
});
