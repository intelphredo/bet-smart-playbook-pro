/**
 * Optimized hook for fetching and caching game data
 * Uses stale-while-revalidate pattern and smart update batching
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { gameCache } from "@/utils/cache/cacheManager";
import { throttle } from "@/utils/cache/updateBatcher";
import { mergeGames, UnifiedGame } from "@/services/data-providers/merge";
import { getESPNGames } from "@/services/data-providers/espn";
import { getSportradarGames } from "@/services/data-providers/sportradar";
import { getOddsApiGames } from "@/services/data-providers/odds-api";
import { getMockGames } from "@/services/data-providers/mock";

interface UseCachedGamesOptions {
  enabled?: boolean;
  liveRefreshInterval?: number;
  normalRefreshInterval?: number;
}

// Cache keys
const CACHE_KEY = 'unified-games';
const QUERY_KEY = ['cached-games'];

export function useCachedGames(options: UseCachedGamesOptions = {}) {
  const {
    enabled = true,
    liveRefreshInterval = 15000, // 15s for live games
    normalRefreshInterval = 60000, // 60s for normal
  } = options;

  const queryClient = useQueryClient();
  const hasLiveGamesRef = useRef(false);

  // Fetch function with SWR caching
  const fetchGames = useCallback(async (): Promise<UnifiedGame[]> => {
    return gameCache.swr(
      CACHE_KEY,
      async () => {
        const [espnGames, sportradarGames, oddsApiGames, mockGames] = await Promise.all([
          getESPNGames().catch(() => []),
          getSportradarGames().catch(() => []),
          getOddsApiGames().catch(() => []),
          getMockGames().catch(() => []),
        ]);

        return mergeGames({
          espnGames,
          sportradarGames,
          oddsApiGames,
          mockGames,
        });
      },
      {
        ttl: normalRefreshInterval,
        staleTime: liveRefreshInterval,
      }
    );
  }, [normalRefreshInterval, liveRefreshInterval]);

  // Main query with dynamic refresh interval
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchGames,
    enabled,
    staleTime: liveRefreshInterval,
    gcTime: normalRefreshInterval * 2,
    refetchInterval: () => hasLiveGamesRef.current ? liveRefreshInterval : normalRefreshInterval,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  // Update live games flag
  useEffect(() => {
    if (query.data) {
      hasLiveGamesRef.current = query.data.some(
        (g) => g.status === 'live' || g.status === 'in_progress'
      );
    }
  }, [query.data]);

  // Throttled refetch to prevent rapid re-fetches
  const throttledRefetch = useMemo(
    () => throttle(() => query.refetch(), 5000),
    [query.refetch]
  );

  // Categorized games
  const { liveGames, upcomingGames, finishedGames } = useMemo(() => {
    const games = query.data ?? [];
    
    return {
      liveGames: games.filter((g) => g.status === 'live' || g.status === 'in_progress'),
      upcomingGames: games.filter((g) => g.status === 'scheduled' || g.status === 'pre')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      finishedGames: games.filter((g) => g.status === 'finished' || g.status === 'final')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    };
  }, [query.data]);

  // Prefetch next data
  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEY,
      queryFn: fetchGames,
      staleTime: liveRefreshInterval,
    });
  }, [queryClient, fetchGames, liveRefreshInterval]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    gameCache.invalidate(CACHE_KEY);
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return {
    games: query.data ?? [],
    liveGames,
    upcomingGames,
    finishedGames,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: throttledRefetch,
    prefetch,
    invalidateCache,
    hasLiveGames: hasLiveGamesRef.current,
    cacheStats: gameCache.getStats(),
  };
}
