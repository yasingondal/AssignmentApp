export function exponentialBackoffMs(retryCount: number, baseMs = 1000, maxMs = 30000): number {
  const delay = baseMs * 2 ** retryCount;
  return Math.min(delay, maxMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; shouldRetry?: (error: unknown) => boolean } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      await new Promise(resolve =>
        setTimeout(resolve, exponentialBackoffMs(attempt, baseDelayMs)),
      );
    }
  }
  throw lastError;
}
