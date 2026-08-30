export type AppEnvironment = 'development' | 'test' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface MockFailureConfig {
  enabled: boolean;
  failureRate: number;
  slowNetworkMs: number;
  timeoutMs: number;
  simulateSessionExpiry: boolean;
  simulateInvalidJson: boolean;
  simulateEmptyResponse: boolean;
  simulatePartialResponse: boolean;
}

export interface EnvironmentConfig {
  env: AppEnvironment;
  apiBaseUrl: string;
  mockApiEnabled: boolean;
  logLevel: LogLevel;
  mockFailure: MockFailureConfig;
  featureFlags: {
    performanceMonitoring: boolean;
    deepLinking: boolean;
    localization: boolean;
  };
}

const isTest = process.env.NODE_ENV === 'test';

export const environment: EnvironmentConfig = {
  env: isTest ? 'test' : __DEV__ ? 'development' : 'production',
  apiBaseUrl: 'https://api.amrutam.local',
  mockApiEnabled: true,
  logLevel: isTest ? 'error' : __DEV__ ? 'debug' : 'warn',
  mockFailure: {
    enabled: __DEV__ && !isTest,
    failureRate: 0.05,
    slowNetworkMs: 0,
    timeoutMs: 15000,
    simulateSessionExpiry: false,
    simulateInvalidJson: false,
    simulateEmptyResponse: false,
    simulatePartialResponse: false,
  },
  featureFlags: {
    performanceMonitoring: __DEV__,
    deepLinking: true,
    localization: true,
  },
};

export function updateMockFailureConfig(
  partial: Partial<MockFailureConfig>,
): void {
  Object.assign(environment.mockFailure, partial);
}
