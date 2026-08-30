import { getHealthRecordById } from '@/features/health-records/data/recordGenerator';
import { getHealthRecordsPage } from '@/features/health-records/data/healthRecordPagination';
import { ValidationError } from '@/core/errors/AppError';
import type { HealthRecordFilters } from '@/features/health-records/domain/types';
import type { ApiRequestConfig } from '@/core/api/apiClient';

export async function handleHealthRecordsApi(
  endpoint: string,
  _config: ApiRequestConfig,
): Promise<unknown> {
  const listMatch = endpoint.match(/^\/health-records\?/);
  const detailMatch = endpoint.match(/^\/health-records\/(hr-\d+)$/);

  if (listMatch) {
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const page = parseInt(params.get('page') ?? '1', 10);
    const pageSize = parseInt(params.get('pageSize') ?? '30', 10);
    const filters = JSON.parse(params.get('filters') ?? '{}') as HealthRecordFilters;
    return getHealthRecordsPage(filters, page, pageSize);
  }

  if (detailMatch) {
    const record = getHealthRecordById(detailMatch[1]!);
    if (!record) {
      throw new ValidationError('Record not found');
    }
    return record;
  }

  throw new ValidationError(`Unknown health records endpoint: ${endpoint}`);
}
