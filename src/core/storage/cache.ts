import { storage } from '@/core/storage/storage';
import { logger } from '@/core/logging/logger';

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
  version: string;
}

const CACHE_VERSION = '1.0.0';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const entry = await storage.get<CacheEntry<T>>(`cache:${key}`);
    if (!entry) {
      return null;
    }
    if (entry.version !== CACHE_VERSION) {
      await storage.remove(`cache:${key}`);
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      logger.debug('Cache expired', { key });
      return null;
    }
    return entry.data;
  },

  async set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      version: CACHE_VERSION,
    };
    await storage.set(`cache:${key}`, entry);
  },

  async getStale<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = await storage.get<CacheEntry<T>>(`cache:${key}`);
    if (!entry || entry.version !== CACHE_VERSION) {
      return null;
    }
    return entry;
  },

  /** Prefer fresh cache, then expired (stale) — used for offline / error fallback. */
  async getFreshOrStale<T>(key: string): Promise<T | null> {
    const fresh = await this.get<T>(key);
    if (fresh) {
      return fresh;
    }
    const stale = await this.getStale<T>(key);
    if (stale) {
      logger.debug('Serving stale cache', { key });
      return stale.data;
    }
    return null;
  },

  async remove(key: string): Promise<void> {
    await storage.remove(`cache:${key}`);
  },
};
