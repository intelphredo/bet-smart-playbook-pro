
import { Match } from "@/types/sports";

/**
 * Enhanced prediction cache with localStorage persistence and TTL
 * Prevents prediction fluctuations on re-calculation
 */

interface CachedPrediction {
  match: Match;
  timestamp: number;
  ttl: number;
}

const CACHE_KEY = 'betsmart-prediction-cache';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500;

// In-memory cache for fast access
const predictionCache: Map<string, CachedPrediction> = new Map();

// Initialize from localStorage on load
function initializeCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, CachedPrediction>;
      const now = Date.now();
      
      // Load non-expired entries
      Object.entries(parsed).forEach(([id, entry]) => {
        if (now - entry.timestamp < entry.ttl) {
          predictionCache.set(id, entry);
        }
      });
      
      console.debug(`[PredictionCache] Loaded ${predictionCache.size} cached predictions`);
    }
  } catch (error) {
    console.warn('[PredictionCache] Failed to load from storage:', error);
  }
}

// Persist to localStorage (debounced)
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
function persistCache(): void {
  if (typeof window === 'undefined') return;
  
  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }
  
  persistTimeout = setTimeout(() => {
    try {
      const entries: Record<string, CachedPrediction> = {};
      predictionCache.forEach((value, key) => {
        entries[key] = value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('[PredictionCache] Failed to persist:', error);
    }
  }, 1000);
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeCache();
}

/**
 * Get a cached prediction for a match ID
 */
export function getCachedPrediction(matchId: string): Match | undefined {
  const entry = predictionCache.get(matchId);
  
  if (!entry) return undefined;
  
  // Check if expired
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    predictionCache.delete(matchId);
    return undefined;
  }
  
  return entry.match;
}

/**
 * Cache a prediction for a match ID
 */
export function cachePrediction(match: Match, ttl: number = DEFAULT_TTL): Match {
  // Evict oldest entries if at capacity
  if (predictionCache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(predictionCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10%
    const toRemove = Math.ceil(MAX_CACHE_SIZE * 0.1);
    entries.slice(0, toRemove).forEach(([key]) => {
      predictionCache.delete(key);
    });
  }
  
  predictionCache.set(match.id, {
    match,
    timestamp: Date.now(),
    ttl,
  });
  
  persistCache();
  return match;
}

/**
 * Check if a prediction exists in the cache and is not expired
 */
export function hasCachedPrediction(matchId: string): boolean {
  const entry = predictionCache.get(matchId);
  if (!entry) return false;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    predictionCache.delete(matchId);
    return false;
  }
  
  return true;
}

/**
 * Clear the entire prediction cache
 */
export function clearPredictionCache(): void {
  predictionCache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * Get cache statistics
 */
export function getPredictionCacheStats(): { size: number; maxSize: number } {
  return {
    size: predictionCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

/**
 * Batch cache multiple predictions
 */
export function cachePredictions(matches: Match[], ttl: number = DEFAULT_TTL): void {
  matches.forEach(match => cachePrediction(match, ttl));
}

/**
 * Get multiple cached predictions
 */
export function getCachedPredictions(matchIds: string[]): Map<string, Match> {
  const results = new Map<string, Match>();
  
  matchIds.forEach(id => {
    const cached = getCachedPrediction(id);
    if (cached) {
      results.set(id, cached);
    }
  });
  
  return results;
}
