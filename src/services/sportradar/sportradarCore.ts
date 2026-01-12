// Sportradar Core API Utilities
// All SportRadar API calls are routed through the edge function for security

import { getCurrentSeasonYear, getCurrentSeasonType } from '@/config/apiConfig';
import { SportLeague, SportradarResponse } from '@/types/sportradar';

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

// Check if API is available (edge function always handles the key check)
export const isApiKeyConfigured = (): boolean => {
  // Always return true since the edge function handles API key validation
  // The key is stored server-side, not in the client
  return true;
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

// Build edge function URL with parameters
export const buildEdgeFunctionUrl = (
  league: SportLeague,
  dataType: string,
  params?: { teamId?: string; playerId?: string }
): string => {
  const searchParams = new URLSearchParams({
    league,
    type: dataType,
  });
  
  if (params?.teamId) searchParams.set("team_id", params.teamId);
  if (params?.playerId) searchParams.set("player_id", params.playerId);
  
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-sportradar?${searchParams}`;
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

// Fetch via edge function with retry and error handling
export const fetchSportradar = async <T>(
  league: SportLeague,
  dataType: string,
  options: {
    cacheDuration?: number;
    skipCache?: boolean;
    retries?: number;
    teamId?: string;
    playerId?: string;
  } = {}
): Promise<SportradarResponse<T>> => {
  const { cacheDuration = CACHE_DURATION, skipCache = false, retries = 3 } = options;
  
  // Build cache key
  const cacheKey = `sportradar:${league}:${dataType}:${options.teamId || ''}:${options.playerId || ''}`;
  
  // Check cache
  if (!skipCache) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
        league
      };
    }
  }
  
  // Rate limiting
  await waitForRateLimit();
  
  const url = buildEdgeFunctionUrl(league, dataType, {
    teamId: options.teamId,
    playerId: options.playerId
  });
  
  console.log(`[Sportradar] Fetching via edge function: ${league}/${dataType}`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Sportradar API Error: ${response.status} - ${errorData.error || response.statusText}`
        );
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error from SportRadar edge function');
      }
      
      // Cache the successful response
      setCachedData(cacheKey, result.data, cacheDuration);
      
      return {
        data: result.data,
        cached: false,
        timestamp: result.fetchedAt || new Date().toISOString(),
        league
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
  // With edge function handling the API key, we don't need mock data
  // The edge function will return an error if the key isn't configured
  return false;
};
