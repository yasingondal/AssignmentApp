import { environment } from '@/core/config/environment';
import {
  AppError,
  AuthenticationError,
  NetworkError,
  ParseError,
  ServerError,
  TimeoutError,
  isAppError,
} from '@/core/errors/AppError';
import { logger } from '@/core/logging/logger';
import { networkService } from '@/core/network/networkService';
import { useSessionStore } from '@/core/auth/sessionStore';
import type { PaginatedResponse } from '@/core/api/types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestConfig {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export type MockHandler = (
  endpoint: string,
  config: ApiRequestConfig,
) => Promise<unknown>;

let mockHandler: MockHandler | null = null;

export function registerMockHandler(handler: MockHandler): void {
  mockHandler = handler;
}

async function simulateFailures(): Promise<void> {
  const config = environment.mockFailure;
  if (!config.enabled) {
    return;
  }

  if (config.simulateSessionExpiry) {
    throw new AuthenticationError();
  }

  if (config.slowNetworkMs > 0) {
    await new Promise(resolve => setTimeout(resolve, config.slowNetworkMs));
  }

  if (config.simulateInvalidJson) {
    throw new ParseError('Simulated invalid JSON');
  }

  if (config.simulateEmptyResponse) {
    throw new ParseError('Simulated empty response');
  }

  if (Math.random() < config.failureRate) {
    throw new ServerError('Simulated random API failure');
  }
}

function applyPartialResponse<T>(result: T): T {
  if (
    environment.mockFailure.simulatePartialResponse &&
    result &&
    typeof result === 'object' &&
    'data' in result &&
    Array.isArray((result as PaginatedResponse<unknown>).data)
  ) {
    const paginated = result as PaginatedResponse<unknown>;
    const half = Math.max(1, Math.floor(paginated.data.length / 2));
    logger.warn('Simulating partial API response', { returned: half, total: paginated.data.length });
    return {
      ...paginated,
      data: paginated.data.slice(0, half),
      hasMore: true,
    } as T;
  }
  return result;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), timeoutMs);
    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const apiClient = {
  async request<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const method = config.method ?? 'GET';
    const timeoutMs = config.timeoutMs ?? environment.mockFailure.timeoutMs;

    if (!networkService.isOnline()) {
      throw new NetworkError(
        method === 'GET'
          ? 'Offline — use cached data'
          : 'Cannot perform write operations while offline',
      );
    }

    const token = useSessionStore.getState().token;
    if (!config.skipAuth && !token) {
      throw new AuthenticationError();
    }

    logger.debug('API request', { endpoint, method });

    try {
      await simulateFailures();

      if (environment.mockApiEnabled && mockHandler) {
        const result = await withTimeout(
          mockHandler(endpoint, config),
          timeoutMs,
        );
        return applyPartialResponse(result as T);
      }

      throw new NetworkError('Real API not configured. Enable mock API.');
    } catch (error) {
      if (isAppError(error)) {
        if (error instanceof AuthenticationError) {
          useSessionStore.getState().clearSession();
        }
        throw error;
      }
      logger.error('API request failed', { endpoint, error });
      throw new AppError({
        code: 'UNKNOWN_ERROR',
        message: String(error),
        userMessage: 'An unexpected error occurred.',
        cause: error,
      });
    }
  },

  get<T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  },

  put<T>(endpoint: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  },

  delete<T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  },
};
