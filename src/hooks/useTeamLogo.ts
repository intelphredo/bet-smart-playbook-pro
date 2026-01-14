import { useState, useEffect, useCallback, useRef } from 'react';
import { League } from '@/types/sports';
import {
  getTeamLogo,
  prefetchLogos,
  generateCacheKey,
  LogoSize,
  LOGO_SIZES,
  getCacheStats,
} from '@/services/logo-service';

export interface UseTeamLogoOptions {
  /** Team name or identifier */
  teamId: string;
  /** Sport/league type */
  sport: League;
  /** Logo size variant */
  size?: LogoSize;
  /** ESPN numeric team ID (useful for NCAA) */
  espnTeamId?: string;
  /** Direct logo URL (bypasses cache lookup) */
  directUrl?: string;
  /** Enable/disable the hook */
  enabled?: boolean;
}

export interface UseTeamLogoResult {
  /** The resolved logo URL */
  logoUrl: string | null;
  /** Whether the logo is currently loading */
  isLoading: boolean;
  /** Whether there was an error loading the logo */
  hasError: boolean;
  /** Error message if any */
  error: string | null;
  /** Retry loading the logo */
  retry: () => void;
  /** Cache hit status for debugging */
  cacheStatus: 'memory' | 'localStorage' | 'network' | 'pending' | 'error';
}

// Default fallback logo (data URL for SVG placeholder)
const FALLBACK_LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23374151'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.35em' font-family='system-ui' font-size='24' font-weight='bold' fill='%239CA3AF'%3E?%3C/text%3E%3C/svg%3E`;

/**
 * Hook for loading team logos with caching
 * 
 * @example
 * ```tsx
 * const { logoUrl, isLoading, hasError } = useTeamLogo({
 *   teamId: 'Lakers',
 *   sport: 'NBA',
 *   size: 'medium',
 * });
 * ```
 */
export function useTeamLogo({
  teamId,
  sport,
  size = 'medium',
  espnTeamId,
  directUrl,
  enabled = true,
}: UseTeamLogoOptions): UseTeamLogoResult {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<UseTeamLogoResult['cacheStatus']>('pending');
  
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const loadLogo = useCallback(async () => {
    if (!enabled || !teamId) {
      setIsLoading(false);
      return;
    }

    // If direct URL is provided, use it immediately
    if (directUrl) {
      setLogoUrl(directUrl);
      setIsLoading(false);
      setCacheStatus('network');
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setHasError(false);
    setError(null);
    setCacheStatus('pending');

    try {
      // Check cache stats before fetch to determine source
      const statsBefore = getCacheStats();
      
      const logo = await getTeamLogo(teamId, sport, size, espnTeamId);
      
      // Only update if this is still the current request
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setLogoUrl(logo.url);
        setIsLoading(false);
        
        // Determine cache status from stats difference
        const statsAfter = getCacheStats();
        if (statsAfter.memoryHits > statsBefore.memoryHits) {
          setCacheStatus('memory');
        } else if (statsAfter.localStorageHits > statsBefore.localStorageHits) {
          setCacheStatus('localStorage');
        } else {
          setCacheStatus('network');
        }
      }
    } catch (err) {
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        console.error('[useTeamLogo] Error loading logo:', err);
        setHasError(true);
        setError(err instanceof Error ? err.message : 'Failed to load logo');
        setLogoUrl(FALLBACK_LOGO);
        setIsLoading(false);
        setCacheStatus('error');
      }
    }
  }, [teamId, sport, size, espnTeamId, directUrl, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    loadLogo();
    
    return () => {
      mountedRef.current = false;
    };
  }, [loadLogo]);

  const retry = useCallback(() => {
    loadLogo();
  }, [loadLogo]);

  return {
    logoUrl,
    isLoading,
    hasError,
    error,
    retry,
    cacheStatus,
  };
}

/**
 * Hook for prefetching multiple team logos
 * 
 * @example
 * ```tsx
 * usePrefetchLogos([
 *   { name: 'Lakers', league: 'NBA' },
 *   { name: 'Celtics', league: 'NBA' },
 * ]);
 * ```
 */
export function usePrefetchLogos(
  teams: Array<{ name: string; league: League; id?: string }>,
  sizes: LogoSize[] = ['medium']
): { isPrefetching: boolean; prefetchedCount: number } {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchedCount, setPrefetchedCount] = useState(0);

  useEffect(() => {
    if (teams.length === 0) return;

    setIsPrefetching(true);
    prefetchLogos(teams, sizes)
      .then(() => {
        setPrefetchedCount(teams.length);
      })
      .finally(() => {
        setIsPrefetching(false);
      });
  }, [teams, sizes]);

  return { isPrefetching, prefetchedCount };
}

/**
 * Get srcset string for responsive logo loading
 */
export function getLogoSrcSet(baseUrl: string): string {
  // ESPN CDN supports different sizes via URL path
  const sizes = ['500', '500', '500']; // ESPN only provides 500px, but we can downscale
  
  return sizes
    .map((size, index) => {
      const descriptor = index === 0 ? '1x' : index === 1 ? '2x' : '3x';
      return `${baseUrl} ${descriptor}`;
    })
    .join(', ');
}

/**
 * Get the size dimensions for a logo size variant
 */
export function getLogoDimensions(size: LogoSize): { width: number; height: number } {
  return {
    width: LOGO_SIZES[size].width,
    height: LOGO_SIZES[size].height,
  };
}

export default useTeamLogo;
