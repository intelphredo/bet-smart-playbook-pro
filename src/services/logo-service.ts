/**
 * Logo Caching Service
 * 
 * Provides multi-tier caching for team logos:
 * 1. Memory cache (Map) for instant access during session
 * 2. localStorage for persistence across sessions (7-day expiration)
 * 3. Fallback to fetch with retry logic
 */

import { League } from "@/types/sports";
import { getTeamLogoUrl } from "@/utils/teamLogos";
import { getNCAABTeamId } from "@/utils/ncaabTeamIds";

// Cache configuration
const CACHE_VERSION = 'v1';
const CACHE_EXPIRATION_DAYS = 7;
const CACHE_PREFIX = `betsmart-logo-${CACHE_VERSION}`;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Logo size configurations
export const LOGO_SIZES = {
  small: { width: 40, height: 40, suffix: 'sm' },
  medium: { width: 80, height: 80, suffix: 'md' },
  large: { width: 120, height: 120, suffix: 'lg' },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

// Memory cache for current session (fastest access)
const memoryCache = new Map<string, CachedLogo>();

// Cache hit/miss statistics
const cacheStats = {
  memoryHits: 0,
  localStorageHits: 0,
  networkFetches: 0,
  failures: 0,
};

interface CachedLogo {
  url: string;
  dataUrl?: string; // Base64 encoded for offline support
  timestamp: number;
  size: LogoSize;
}

interface CacheEntry {
  data: CachedLogo;
  expiresAt: number;
}

/**
 * Generate a unique cache key for a team logo
 */
export function generateCacheKey(
  teamId: string,
  sport: string,
  size: LogoSize
): string {
  const normalizedTeam = teamId.toLowerCase().replace(/\s+/g, '-');
  const normalizedSport = sport.toLowerCase();
  return `${CACHE_PREFIX}-${normalizedTeam}-${normalizedSport}-${size}`;
}

/**
 * Check if a cached entry is expired
 */
function isCacheExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Get expiration timestamp
 */
function getExpirationTime(): number {
  return Date.now() + CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Get logo from memory cache (fastest)
 */
function getFromMemoryCache(key: string): CachedLogo | null {
  const cached = memoryCache.get(key);
  if (cached) {
    cacheStats.memoryHits++;
    return cached;
  }
  return null;
}

/**
 * Get logo from localStorage (persistent)
 */
function getFromLocalStorage(key: string): CachedLogo | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const entry: CacheEntry = JSON.parse(stored);
    
    if (isCacheExpired(entry.expiresAt)) {
      localStorage.removeItem(key);
      return null;
    }

    // Also store in memory cache for faster subsequent access
    memoryCache.set(key, entry.data);
    cacheStats.localStorageHits++;
    return entry.data;
  } catch (error) {
    console.warn('[LogoService] Error reading from localStorage:', error);
    return null;
  }
}

/**
 * Save logo to both caches
 */
function saveToCache(key: string, logo: CachedLogo): void {
  // Save to memory cache
  memoryCache.set(key, logo);

  // Save to localStorage
  try {
    const entry: CacheEntry = {
      data: logo,
      expiresAt: getExpirationTime(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full or disabled
    console.warn('[LogoService] Error saving to localStorage:', error);
    cleanupOldCacheEntries();
  }
}

/**
 * Clean up old cache entries when storage is full
 */
function cleanupOldCacheEntries(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '');
          if (isCacheExpired(entry.expiresAt)) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[LogoService] Cleaned up ${keysToRemove.length} expired entries`);
  } catch (error) {
    console.warn('[LogoService] Error during cleanup:', error);
  }
}

/**
 * Build the logo URL based on team and league
 */
export function buildLogoUrl(
  teamName: string,
  league: League,
  teamId?: string,
  size: LogoSize = 'medium'
): string {
  const isNCAA = league === "NCAAB" || league === "NCAAF";
  const sizeConfig = LOGO_SIZES[size];
  
  // For NCAA, use numeric team ID
  if (isNCAA) {
    if (teamId && /^\d+$/.test(teamId)) {
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamId}.png`;
    }
    const mappedId = getNCAABTeamId(teamName);
    if (mappedId) {
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${mappedId}.png`;
    }
  }

  // For MLB, use mlbstatic CDN
  if (league === "MLB" && teamId) {
    return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
  }

  // Default ESPN CDN
  return getTeamLogoUrl(teamName, league);
}

/**
 * Fetch logo with retry logic
 */
async function fetchLogoWithRetry(
  url: string,
  retries: number = MAX_RETRIES
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'HEAD', // Just check if URL is valid
        mode: 'no-cors', // ESPN CDN may have CORS restrictions
      });
      
      // If we get here, the URL is accessible
      cacheStats.networkFetches++;
      return url;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }
  }

  cacheStats.failures++;
  throw lastError || new Error('Failed to fetch logo');
}

/**
 * Convert image URL to base64 for offline caching
 */
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Main function to get a team logo with caching
 */
export async function getTeamLogo(
  teamName: string,
  league: League,
  size: LogoSize = 'medium',
  teamId?: string
): Promise<CachedLogo> {
  const cacheKey = generateCacheKey(teamId || teamName, league, size);

  // 1. Check memory cache first (fastest)
  const memoryCached = getFromMemoryCache(cacheKey);
  if (memoryCached) {
    return memoryCached;
  }

  // 2. Check localStorage (persistent)
  const storageCached = getFromLocalStorage(cacheKey);
  if (storageCached) {
    return storageCached;
  }

  // 3. Build URL and validate
  const url = buildLogoUrl(teamName, league, teamId, size);
  
  try {
    await fetchLogoWithRetry(url);
    
    const logo: CachedLogo = {
      url,
      timestamp: Date.now(),
      size,
    };

    // Save to cache
    saveToCache(cacheKey, logo);
    
    return logo;
  } catch (error) {
    console.warn(`[LogoService] Failed to fetch logo for ${teamName}:`, error);
    
    // Return URL anyway (browser will handle 404)
    return {
      url,
      timestamp: Date.now(),
      size,
    };
  }
}

/**
 * Prefetch logos for upcoming games
 */
export async function prefetchLogos(
  teams: Array<{ name: string; league: League; id?: string }>,
  sizes: LogoSize[] = ['medium']
): Promise<void> {
  const prefetchPromises = teams.flatMap(team =>
    sizes.map(size => 
      getTeamLogo(team.name, team.league, size, team.id).catch(() => null)
    )
  );

  await Promise.allSettled(prefetchPromises);
  console.log(`[LogoService] Prefetched ${teams.length} team logos`);
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): typeof cacheStats & { 
  hitRate: number;
  memoryCacheSize: number;
} {
  const total = cacheStats.memoryHits + cacheStats.localStorageHits + 
                cacheStats.networkFetches + cacheStats.failures;
  const hits = cacheStats.memoryHits + cacheStats.localStorageHits;
  
  return {
    ...cacheStats,
    hitRate: total > 0 ? (hits / total) * 100 : 0,
    memoryCacheSize: memoryCache.size,
  };
}

/**
 * Log cache statistics (for debugging)
 */
export function logCacheStats(): void {
  const stats = getCacheStats();
  console.log('[LogoService] Cache Statistics:', {
    memoryHits: stats.memoryHits,
    localStorageHits: stats.localStorageHits,
    networkFetches: stats.networkFetches,
    failures: stats.failures,
    hitRate: `${stats.hitRate.toFixed(1)}%`,
    memoryCacheSize: stats.memoryCacheSize,
  });
}

/**
 * Clear all cached logos
 */
export function clearLogoCache(): void {
  // Clear memory cache
  memoryCache.clear();

  // Clear localStorage entries
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  console.log(`[LogoService] Cleared ${keysToRemove.length} cached logos`);
}

/**
 * Preload logos into memory from localStorage on app start
 */
export function preloadFromLocalStorage(): void {
  let loadedCount = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '');
        if (!isCacheExpired(entry.expiresAt)) {
          memoryCache.set(key, entry.data);
          loadedCount++;
        }
      } catch {
        // Invalid entry, ignore
      }
    }
  }

  if (loadedCount > 0) {
    console.log(`[LogoService] Preloaded ${loadedCount} logos from localStorage`);
  }
}

// Auto-preload on module initialization
if (typeof window !== 'undefined') {
  preloadFromLocalStorage();
}
