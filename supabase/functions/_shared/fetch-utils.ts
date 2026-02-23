/**
 * Shared fetch utilities for edge functions
 * Provides timeouts and retry logic for all external API calls
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch with AbortController timeout
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeout (default: 15000ms)
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch with timeout + retry logic for transient failures
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryOptions - Retry configuration
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithTimeoutOptions = {},
  retryOptions: { maxRetries?: number; retryDelay?: number; retryOn?: number[] } = {}
): Promise<Response> {
  const { maxRetries = 2, retryDelay = 1000, retryOn = [502, 503, 504, 429] } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      // Only retry on specific status codes
      if (!response.ok && retryOn.includes(response.status) && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Retryable error ${response.status} from ${url}, retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Retry on network/timeout errors
      if (attempt < maxRetries) {
        const isTimeout = lastError.name === "AbortError";
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(
          `${isTimeout ? "Timeout" : "Network error"} fetching ${url}, retry ${attempt + 1}/${maxRetries} in ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
