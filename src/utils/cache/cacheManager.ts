/**
 * Centralized Cache Manager
 * Provides tiered caching with TTL, stale-while-revalidate, and memory management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleTime: number;
}

interface CacheConfig {
  maxEntries?: number;
  defaultTTL?: number;
  defaultStaleTime?: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = [];
  private maxEntries: number;
  private defaultTTL: number;
  private defaultStaleTime: number;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(config: CacheConfig = {}) {
    this.maxEntries = config.maxEntries ?? 500;
    this.defaultTTL = config.defaultTTL ?? 5 * 60 * 1000; // 5 minutes
    this.defaultStaleTime = config.defaultStaleTime ?? 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Get cached data with stale-while-revalidate support
   */
  get<T>(key: string): { data: T | null; isStale: boolean; isExpired: boolean } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { data: null, isStale: false, isExpired: true };
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const isStale = age > entry.staleTime;
    const isExpired = age > entry.ttl;

    // Update access order for LRU
    this.updateAccessOrder(key);

    return {
      data: entry.data as T,
      isStale,
      isExpired,
    };
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, options?: { ttl?: number; staleTime?: number }): void {
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxEntries) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl ?? this.defaultTTL,
      staleTime: options?.staleTime ?? this.defaultStaleTime,
    });

    this.updateAccessOrder(key);
  }

  /**
   * Request deduplication - prevents duplicate in-flight requests
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if request is already in flight
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Start new request
    const promise = fetcher().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Stale-while-revalidate pattern
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; staleTime?: number }
  ): Promise<T> {
    const cached = this.get<T>(key);

    // Return fresh data immediately
    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    // Return stale data while revalidating in background
    if (cached.data && cached.isStale && !cached.isExpired) {
      // Revalidate in background
      this.dedupe(key, fetcher).then((data) => {
        this.set(key, data, options);
      });
      return cached.data;
    }

    // Fetch fresh data
    const data = await this.dedupe(key, fetcher);
    this.set(key, data, options);
    return data;
  }

  /**
   * Invalidate cache entries by key or pattern
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
      this.accessOrder = this.accessOrder.filter(k => k !== keyOrPattern);
    } else {
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (keyOrPattern.test(key)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
      });
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxEntries: number; pendingRequests: number } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      pendingRequests: this.pendingRequests.size,
    };
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}

// Singleton instances for different data types
export const gameCache = new CacheManager({
  maxEntries: 200,
  defaultTTL: 2 * 60 * 1000, // 2 minutes for games
  defaultStaleTime: 30 * 1000, // 30 seconds stale time
});

export const oddsCache = new CacheManager({
  maxEntries: 500,
  defaultTTL: 60 * 1000, // 1 minute for odds
  defaultStaleTime: 15 * 1000, // 15 seconds stale time
});

export const standingsCache = new CacheManager({
  maxEntries: 50,
  defaultTTL: 10 * 60 * 1000, // 10 minutes for standings
  defaultStaleTime: 5 * 60 * 1000, // 5 minutes stale time
});

export const injuryCache = new CacheManager({
  maxEntries: 100,
  defaultTTL: 15 * 60 * 1000, // 15 minutes for injuries
  defaultStaleTime: 10 * 60 * 1000, // 10 minutes stale time
});

// Default cache instance
export const cache = new CacheManager();

export default CacheManager;
