import { useEffect, useRef, useCallback } from 'react';
import { League } from '@/types/sports';
import { prefetchLogos, LogoSize, getCacheStats, logCacheStats } from '@/services/logo-service';

export interface TeamForPrefetch {
  name: string;
  league: League;
  id?: string;
}

/**
 * Hook to prefetch logos for upcoming games
 * 
 * @example
 * ```tsx
 * // Prefetch logos when games data loads
 * useLogoPrefetch(
 *   games.flatMap(game => [
 *     { name: game.homeTeam, league: 'NBA' },
 *     { name: game.awayTeam, league: 'NBA' },
 *   ])
 * );
 * ```
 */
export function useLogoPrefetch(
  teams: TeamForPrefetch[],
  sizes: LogoSize[] = ['medium'],
  options: {
    /** Delay before starting prefetch (ms) */
    delay?: number;
    /** Log cache stats after prefetch */
    logStats?: boolean;
    /** Only prefetch if not already cached */
    skipIfCached?: boolean;
  } = {}
): void {
  const { delay = 100, logStats = false } = options;
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (teams.length === 0) return;

    // Deduplicate teams
    const uniqueTeams = teams.filter(team => {
      const key = `${team.name}-${team.league}-${team.id || ''}`;
      if (prefetchedRef.current.has(key)) return false;
      prefetchedRef.current.add(key);
      return true;
    });

    if (uniqueTeams.length === 0) return;

    const timeoutId = setTimeout(async () => {
      await prefetchLogos(uniqueTeams, sizes);
      
      if (logStats) {
        logCacheStats();
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [teams, sizes, delay, logStats]);
}

/**
 * Hook to prefetch logos when component becomes visible
 * Uses IntersectionObserver for viewport detection
 */
export function useLazyLogoPrefetch(
  teams: TeamForPrefetch[],
  sizes: LogoSize[] = ['medium']
): {
  ref: React.RefCallback<HTMLElement>;
  isPrefetched: boolean;
} {
  const prefetchedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((element: HTMLElement | null) => {
    if (prefetchedRef.current || !element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !prefetchedRef.current) {
          prefetchedRef.current = true;
          prefetchLogos(teams, sizes);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '200px' } // Prefetch 200px before visible
    );

    observerRef.current.observe(element);
  }, [teams, sizes]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ref,
    isPrefetched: prefetchedRef.current,
  };
}

/**
 * Hook to monitor and log cache performance
 */
export function useLogoCacheMonitor(
  intervalMs: number = 30000 // Log every 30 seconds
): {
  stats: ReturnType<typeof getCacheStats>;
  logNow: () => void;
} {
  const stats = getCacheStats();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const intervalId = setInterval(() => {
      const currentStats = getCacheStats();
      if (currentStats.memoryHits + currentStats.networkFetches > 0) {
        console.log('[LogoCache] Performance:', {
          hitRate: `${currentStats.hitRate.toFixed(1)}%`,
          memoryHits: currentStats.memoryHits,
          storageHits: currentStats.localStorageHits,
          networkFetches: currentStats.networkFetches,
          cacheSize: currentStats.memoryCacheSize,
        });
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);

  return {
    stats,
    logNow: logCacheStats,
  };
}

export default useLogoPrefetch;
