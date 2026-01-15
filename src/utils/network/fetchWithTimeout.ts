/**
 * Shared fetch utilities with timeout and retry support
 * Consolidates duplicate implementations from services
 */

export interface FetchWithTimeoutOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Fetch with timeout - cancels request if it takes too long
 * @param url - The URL to fetch
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @param options - Additional fetch options
 */
export async function fetchWithTimeout(
  url: string,
  timeout = 10000,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Check if an error is an AbortError (timeout)
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export default fetchWithTimeout;
