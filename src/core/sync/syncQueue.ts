import { generateId } from '@/core/utils/id';
import { create } from 'zustand';
import { storage } from '@/core/storage/storage';
import { logger } from '@/core/logging/logger';

export type SyncOperationType = 'CREATE_BOOKING' | 'CANCEL_BOOKING';
export type SyncOperationStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: SyncOperationStatus;
  lastError?: string;
  idempotencyKey: string;
}

const QUEUE_KEY = 'sync_queue';
const MAX_RETRIES = 5;

interface SyncQueueState {
  operations: SyncOperation[];
  isProcessing: boolean;
  hydrate: () => Promise<void>;
  enqueue: (type: SyncOperationType, payload: Record<string, unknown>, idempotencyKey?: string) => SyncOperation;
  markSyncing: (id: string) => void;
  markCompleted: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  getPending: () => SyncOperation[];
  remove: (id: string) => void;
  persist: () => Promise<void>;
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  operations: [],
  isProcessing: false,

  hydrate: async () => {
    const saved = await storage.get<SyncOperation[]>(QUEUE_KEY);
    if (saved) {
      set({ operations: saved });
    }
  },

  enqueue: (type, payload, idempotencyKey) => {
    const existing = get().operations.find(
      op => op.idempotencyKey === idempotencyKey && op.status !== 'completed',
    );
    if (existing && idempotencyKey) {
      logger.info('Duplicate sync operation prevented', { idempotencyKey });
      return existing;
    }

    const operation: SyncOperation = {
      id: generateId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
      idempotencyKey: idempotencyKey ?? generateId(),
    };

    set(state => ({ operations: [...state.operations, operation] }));
    void get().persist();
    return operation;
  },

  markSyncing: (id) => {
    set(state => ({
      operations: state.operations.map(op =>
        op.id === id ? { ...op, status: 'syncing' as const } : op,
      ),
    }));
    void get().persist();
  },

  markCompleted: (id) => {
    set(state => ({
      operations: state.operations.filter(op => op.id !== id),
    }));
    void get().persist();
  },

  markFailed: (id, error) => {
    set(state => ({
      operations: state.operations.map(op =>
        op.id === id
          ? {
              ...op,
              status: 'failed' as const,
              lastError: error,
              retryCount: op.retryCount + 1,
            }
          : op,
      ),
    }));
    void get().persist();
  },

  getPending: () =>
    get().operations.filter(
      op => op.status === 'pending' || (op.status === 'failed' && op.retryCount < MAX_RETRIES),
    ),

  remove: (id) => {
    set(state => ({
      operations: state.operations.filter(op => op.id !== id),
    }));
    void get().persist();
  },

  persist: async () => {
    await storage.set(QUEUE_KEY, get().operations);
  },
}));

export { MAX_RETRIES };
