import { environment, type LogLevel } from '@/core/config/environment';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[environment.logLevel];
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const prefix = `[${level.toUpperCase()}]`;
  if (meta !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(meta)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message, meta));
    }
  },
  info(message: string, meta?: unknown): void {
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(formatMessage('info', message, meta));
    }
  },
  warn(message: string, meta?: unknown): void {
    if (shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage('warn', message, meta));
    }
  },
  error(message: string, meta?: unknown): void {
    if (shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(formatMessage('error', message, meta));
    }
  },
};
