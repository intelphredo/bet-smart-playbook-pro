// src/utils/fetchWithRetry.ts

export interface FetchWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry<T = any>(
  url: string,
  options: FetchWithRetryOptions & RequestInit = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, timeout = 10000, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType || 'unknown'} from ${url}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed to fetch after retries");
}

export default fetchWithRetry;
