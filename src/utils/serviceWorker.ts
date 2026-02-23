/**
 * Service worker registration for offline caching of recent data.
 * Uses Cache API to store API responses for offline access.
 */

const CACHE_NAME = 'edgeiq-v1';
const OFFLINE_CACHE_URLS = [
  '/',
  '/index.html',
];

// API responses to cache for offline access
const API_CACHE_PATTERNS = [
  /site\.api\.espn\.com/,
  /pyknizknsygpmodoioae\.supabase\.co\/rest/,
];

const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Use a simple cache-first strategy via the Cache API
    // instead of a full service worker (simpler, no SW file needed)
    await setupCacheStrategy();
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
  }
}

/**
 * Lightweight offline caching using Cache API directly.
 * Caches API responses for offline access without a service worker file.
 */
async function setupCacheStrategy() {
  if (!('caches' in window)) return;

  // Clean old caches on startup
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cachedAt = response.headers.get('x-cached-at');
        if (cachedAt && now - parseInt(cachedAt) > MAX_CACHE_AGE) {
          await cache.delete(request);
        }
      }
    }
  } catch {
    // Ignore cache cleanup errors
  }
}

/**
 * Cache a fetch response for offline access.
 * Call this after successful API fetches for critical data.
 */
export async function cacheResponse(url: string, response: Response) {
  if (!('caches' in window)) return;

  try {
    const shouldCache = API_CACHE_PATTERNS.some(p => p.test(url));
    if (!shouldCache) return;

    const cache = await caches.open(CACHE_NAME);
    const cloned = response.clone();

    // Add timestamp header
    const headers = new Headers(cloned.headers);
    headers.set('x-cached-at', Date.now().toString());

    const cachedResponse = new Response(await cloned.blob(), {
      status: cloned.status,
      statusText: cloned.statusText,
      headers,
    });

    await cache.put(url, cachedResponse);
  } catch {
    // Silently fail - caching is best-effort
  }
}

/**
 * Try to get a cached response for offline access.
 */
export async function getCachedResponse(url: string): Promise<Response | null> {
  if (!('caches' in window)) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);

    if (cached) {
      const cachedAt = cached.headers.get('x-cached-at');
      if (cachedAt && Date.now() - parseInt(cachedAt) < MAX_CACHE_AGE) {
        return cached;
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}
