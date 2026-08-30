import { registerMockHandler } from '@/core/api/apiClient';
import { handleConsultationApi } from '@/features/consultation/data/mockConsultationHandler';
import { handleShopApi } from '@/features/shop/data/mockShopHandler';
import { handleHealthRecordsApi } from '@/features/health-records/data/mockHealthRecordsHandler';
import { ValidationError } from '@/core/errors/AppError';
import type { ApiRequestConfig } from '@/core/api/apiClient';

async function routeMockApi(endpoint: string, config: ApiRequestConfig): Promise<unknown> {
  if (endpoint.startsWith('/doctors') || endpoint.startsWith('/bookings')) {
    return handleConsultationApi(endpoint, config);
  }
  if (endpoint.startsWith('/products')) {
    return handleShopApi(endpoint, config);
  }
  if (endpoint.startsWith('/health-records')) {
    return handleHealthRecordsApi(endpoint, config);
  }
  throw new ValidationError(`Unknown endpoint: ${endpoint}`);
}

export function initMockApi(): void {
  registerMockHandler(routeMockApi);
}
