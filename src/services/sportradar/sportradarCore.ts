// Sportradar Core API Utilities
// Handles authentication, caching, rate limiting, and error handling

import { API_CONFIGS, DEFAULT_HEADERS, getCurrentSeasonYear, getCurrentSeasonType } from '@/config/apiConfig';
import { SportLeague, SportradarError, SportradarResponse } from '@/types/sportradar';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INJURY_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for injuries
const STANDINGS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for standings

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache
const apiCache = new Map<string, CacheEntry<any>>();

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Check if API key is configured
export const isApiKeyConfigured = (): boolean => {
  const apiKey = API_CONFIGS.SPORTRADAR.API_KEY;
  return !!apiKey && apiKey.length > 10;
};

// Get cache entry
export const getCachedData = <T>(cacheKey: string): T | null => {
  const entry = apiCache.get(cacheKey);
  if (entry && Date.now() < entry.expiresAt) {
    console.log(`[Sportradar] Cache hit for: ${cacheKey}`);
    return entry.data;
  }
  if (entry) {
    apiCache.delete(cacheKey);
  }
  return null;
};

// Set cache entry
export const setCachedData = <T>(cacheKey: string, data: T, duration: number = CACHE_DURATION): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + duration
  };
  apiCache.set(cacheKey, entry);
  console.log(`[Sportradar] Cached: ${cacheKey} for ${duration / 1000}s`);
};

// Clear cache for a specific pattern
export const clearCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
};

// Rate limiting helper
const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Build URL with parameters
export const buildUrl = (
  endpoint: string,
  params: Record<string, string | number>
): string => {
  let url = `${API_CONFIGS.SPORTRADAR.BASE_URL}${endpoint}`;
  
  // Replace template placeholders
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{{${key}}}`, String(value));
  });
  
  // Add API key
  const separator = url.includes('?') ? '&' : '?';
  url += `${separator}api_key=${API_CONFIGS.SPORTRADAR.API_KEY}`;
  
  return url;
};

// Format date for API
export const formatDateForApi = (date: Date): { year: string; month: string; day: string } => {
  return {
    year: date.getFullYear().toString(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0')
  };
};

// Get season parameters
export const getSeasonParams = (league: SportLeague): { year: number; season_type: string } => {
  return {
    year: getCurrentSeasonYear(league),
    season_type: getCurrentSeasonType(league)
  };
};

// Fetch with retry and error handling
export const fetchSportradar = async <T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: {
    cacheDuration?: number;
    skipCache?: boolean;
    retries?: number;
  } = {}
): Promise<SportradarResponse<T>> => {
  const { cacheDuration = CACHE_DURATION, skipCache = false, retries = 3 } = options;
  
  // Check if API key is configured
  if (!isApiKeyConfigured()) {
    console.warn('[Sportradar] API key not configured, returning empty data');
    throw new Error('Sportradar API key not configured');
  }
  
  // Build cache key
  const cacheKey = `sportradar:${endpoint}:${JSON.stringify(params)}`;
  
  // Check cache
  if (!skipCache) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
        league: (params.league as SportLeague) || 'NBA'
      };
    }
  }
  
  // Rate limiting
  await waitForRateLimit();
  
  const url = buildUrl(endpoint, params);
  console.log(`[Sportradar] Fetching: ${endpoint}`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Sportradar API Error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }
      
      const data = await response.json();
      
      // Cache the successful response
      setCachedData(cacheKey, data, cacheDuration);
      
      return {
        data,
        cached: false,
        timestamp: new Date().toISOString(),
        league: (params.league as SportLeague) || 'NBA'
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Sportradar] Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < retries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch from Sportradar');
};

// Specific cache durations
export { CACHE_DURATION, INJURY_CACHE_DURATION, STANDINGS_CACHE_DURATION };

// Export helper to check if we should use mock data
export const shouldUseMockData = (): boolean => {
  return !isApiKeyConfigured();
};
