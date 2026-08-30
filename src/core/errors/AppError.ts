export type AppErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONFLICT_ERROR'
  | 'SERVER_ERROR'
  | 'PARSE_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly cause?: unknown;

  constructor(options: {
    code: AppErrorCode;
    message: string;
    userMessage: string;
    retryable?: boolean;
    statusCode?: number;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
    this.cause = options.cause;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network request failed') {
    super({
      code: 'NETWORK_ERROR',
      message,
      userMessage: 'Please check your internet connection and try again.',
      retryable: true,
    });
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timed out') {
    super({
      code: 'TIMEOUT_ERROR',
      message,
      userMessage: 'The request took too long. Please try again.',
      retryable: true,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Session expired') {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
      userMessage: 'Your session has expired. Please sign in again.',
      retryable: false,
      statusCode: 401,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      userMessage: userMessage ?? message,
      retryable: false,
      statusCode: 400,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, userMessage?: string) {
    super({
      code: 'CONFLICT_ERROR',
      message,
      userMessage: userMessage ?? 'This action conflicts with existing data.',
      retryable: false,
      statusCode: 409,
    });
  }
}

export class ServerError extends AppError {
  constructor(message = 'Internal server error', statusCode = 500) {
    super({
      code: 'SERVER_ERROR',
      message,
      userMessage: 'Something went wrong on our end. Please try again later.',
      retryable: true,
      statusCode,
    });
  }
}

export class ParseError extends AppError {
  constructor(message = 'Failed to parse response') {
    super({
      code: 'PARSE_ERROR',
      message,
      userMessage: 'Received an unexpected response. Please try again.',
      retryable: false,
    });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
