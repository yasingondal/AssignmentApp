import { networkService } from '@/core/network/networkService';
import { useSyncQueueStore } from '@/core/sync/syncQueue';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { logger } from '@/core/logging/logger';
import { exponentialBackoffMs } from '@/core/utils/retry';
import { isAppError } from '@/core/errors/AppError';

class SyncService {
  private processing = false;
  private unsubscribe: (() => void) | null = null;

  init(): void {
    this.unsubscribe = networkService.subscribe(status => {
      if (status === 'reconnecting' || status === 'online') {
        void this.processQueue();
      }
    });
  }

  destroy(): void {
    this.unsubscribe?.();
  }

  async processQueue(): Promise<void> {
    if (this.processing || !networkService.isOnline()) {
      return;
    }

    this.processing = true;
    const pending = useSyncQueueStore.getState().getPending();

    for (const operation of pending) {
      useSyncQueueStore.getState().markSyncing(operation.id);

      try {
        if (operation.retryCount > 0) {
          await new Promise(resolve =>
            setTimeout(resolve, exponentialBackoffMs(operation.retryCount)),
          );
        }

        switch (operation.type) {
          case 'CREATE_BOOKING':
            await consultationRepository.syncBooking(operation.payload, operation.idempotencyKey);
            break;
          case 'CANCEL_BOOKING':
            await consultationRepository.syncCancellation(
              operation.payload.bookingId as string,
              operation.idempotencyKey,
            );
            break;
        }

        useSyncQueueStore.getState().markCompleted(operation.id);
        logger.info('Sync operation completed', { id: operation.id, type: operation.type });
      } catch (error) {
        const message = isAppError(error) ? error.userMessage : String(error);
        useSyncQueueStore.getState().markFailed(operation.id, message);
        logger.error('Sync operation failed', { id: operation.id, error: message });
      }
    }

    this.processing = false;
  }
}

export const syncService = new SyncService();
