import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { clearSlotCache } from '@/features/consultation/data/slotGenerator';
import { generateId } from '@/core/utils/id';
import { initMockApi } from '@/core/api/mockApiRouter';
import { networkService } from '@/core/network/networkService';
import { useSyncQueueStore } from '@/core/sync/syncQueue';
import { syncService } from '@/core/sync/syncService';
import { storage } from '@/core/storage/storage';
import { apiClient } from '@/core/api/apiClient';
import { NetworkError } from '@/core/errors/AppError';

jest.mock('@/core/network/networkService', () => {
  const mockState = { online: true };
  return {
    networkService: {
      isOnline: () => mockState.online,
      isForcedOffline: () => !mockState.online,
      setForcedOffline: (value: boolean) => {
        mockState.online = !value;
      },
      init: jest.fn(),
      subscribe: (listener: (status: string) => void) => {
        listener(mockState.online ? 'online' : 'offline');
        return jest.fn();
      },
      getStatus: () => (mockState.online ? 'online' : 'offline'),
      __setOnline: (value: boolean) => {
        mockState.online = value;
      },
    },
  };
});

type MockNetwork = typeof networkService & { __setOnline: (value: boolean) => void };
const mockNetwork = networkService as MockNetwork;

describe('Offline-first behavior', () => {
  beforeAll(() => {
    initMockApi();
  });

  beforeEach(async () => {
    clearSlotCache();
    mockNetwork.__setOnline(true);
    await consultationRepository._resetForTests();
    useSyncQueueStore.setState({ operations: [] });
    await storage.remove('sync_queue');
  });

  it('rejects API requests while offline', async () => {
    mockNetwork.__setOnline(false);
    await expect(apiClient.get('/doctors?page=1&pageSize=1&filters=%7B%7D')).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('queues bookings offline and confirms them after reconnect sync', async () => {
    mockNetwork.__setOnline(true);
    const doctors = await consultationRepository.getDoctors({}, 1, 1);
    const doctor = doctors.data[0]!;
    const slots = await consultationRepository.getSlots(doctor.id);
    const slot = slots.find(s => s.status === 'available')!;

    mockNetwork.__setOnline(false);
    const key = generateId();
    const offlineBooking = await consultationRepository.createBooking({
      doctorId: doctor.id,
      slotId: slot.id,
      idempotencyKey: key,
    });

    expect(offlineBooking.status).toBe('pending');
    const pendingOps = useSyncQueueStore.getState().getPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]!.type).toBe('CREATE_BOOKING');

    mockNetwork.__setOnline(true);
    await syncService.processQueue();

    const bookings = await consultationRepository.getBookings();
    const synced = bookings.find(b => b.idempotencyKey === key);
    expect(synced?.status).toBe('confirmed');
    expect(useSyncQueueStore.getState().getPending()).toHaveLength(0);
  });

  it('serves cached doctor pages when offline', async () => {
    mockNetwork.__setOnline(true);
    const onlinePage = await consultationRepository.getDoctors({}, 1, 10);

    mockNetwork.__setOnline(false);
    const offlinePage = await consultationRepository.getDoctors({}, 1, 10);
    expect(offlinePage.data).toHaveLength(onlinePage.data.length);
    expect(offlinePage.data[0]!.id).toBe(onlinePage.data[0]!.id);
  });
});
