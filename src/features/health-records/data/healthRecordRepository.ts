import { apiClient } from '@/core/api/apiClient';
import type { PaginatedResponse } from '@/core/api/types';
import { cache } from '@/core/storage/cache';
import { networkService } from '@/core/network/networkService';
import { getHealthRecordsPage } from '@/features/health-records/data/healthRecordPagination';
import { getHealthRecordById } from '@/features/health-records/data/recordGenerator';
import type { HealthRecord, HealthRecordFilters } from '@/features/health-records/domain/types';

class HealthRecordRepository {
  async getRecords(
    filters: HealthRecordFilters,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<HealthRecord>> {
    const cacheKey = `health:${JSON.stringify(filters)}:${page}:${pageSize}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<PaginatedResponse<HealthRecord>>(cacheKey);
      if (cached) {
        return cached;
      }
      return this.getRecordsLocal(filters, page, pageSize);
    }

    try {
      const result = await apiClient.get<PaginatedResponse<HealthRecord>>(
        `/health-records?page=${page}&pageSize=${pageSize}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
      );
      await cache.set(cacheKey, result);
      return result;
    } catch {
      const cached = await cache.getFreshOrStale<PaginatedResponse<HealthRecord>>(cacheKey);
      if (cached) {
        return cached;
      }
      return this.getRecordsLocal(filters, page, pageSize);
    }
  }

  getRecordsLocal(
    filters: HealthRecordFilters,
    page: number,
    pageSize: number,
  ): PaginatedResponse<HealthRecord> {
    return getHealthRecordsPage(filters, page, pageSize);
  }

  async getRecordById(id: string): Promise<HealthRecord | null> {
    const cacheKey = `health-record:${id}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<HealthRecord>(cacheKey);
      if (cached) {
        return cached;
      }
      return getHealthRecordById(id) ?? null;
    }

    try {
      const record = await apiClient.get<HealthRecord>(`/health-records/${id}`);
      await cache.set(cacheKey, record);
      return record;
    } catch {
      const cached = await cache.getFreshOrStale<HealthRecord>(cacheKey);
      if (cached) {
        return cached;
      }
      return getHealthRecordById(id) ?? null;
    }
  }
}

export const healthRecordRepository = new HealthRecordRepository();
