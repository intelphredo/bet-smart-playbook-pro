// src/hooks/useGames.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { mergeGames } from "@/services/data-providers/merge";
import { getESPNGames } from "@/services/data-providers/espn";
import { getSportradarGames } from "@/services/data-providers/sportradar";
import { getOddsApiGames } from "@/services/data-providers/odds-api";
import { getMockGames } from "@/services/data-providers/mock";
import { toast } from "@/components/ui/use-toast";
import { gameCache } from "@/utils/cache/cacheManager";
import { throttle } from "@/utils/cache/updateBatcher";

export interface UnifiedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  odds?: any;
  injuries?: any;
  league?: string;
  source: string;
  lastUpdated: string;
  score?: {
    home: number;
    away: number;
    period?: string;
  };
}

// Cache key for deduplication
const GAMES_CACHE_KEY = 'unified-games-v1';

// Fetch function with caching layer
async function fetchGamesWithCache(): Promise<UnifiedGame[]> {
  return gameCache.swr(
    GAMES_CACHE_KEY,
    async () => {
      // Fetch all providers in parallel
      const [espnGames, sportradarGames, oddsApiGames, mockGames] =
        await Promise.all([
          getESPNGames().catch(() => []),
          getSportradarGames().catch(() => []),
          getOddsApiGames().catch(() => []),
          getMockGames().catch(() => []),
        ]);

      // Merge into unified objects
      return mergeGames({
        espnGames,
        sportradarGames,
        oddsApiGames,
        mockGames,
      });
    },
    {
      ttl: 60000, // 1 minute TTL
      staleTime: 15000, // 15 second stale time for live games
    }
  );
}

export const useGames = () => {
  const hasShownMockToast = useRef(false);
  const hasLiveGamesRef = useRef(false);
  const queryClient = useQueryClient();

  const query = useQuery<UnifiedGame[]>({
    queryKey: ["games"],
    queryFn: fetchGamesWithCache,
    // Dynamic stale time based on live games
    staleTime: () => hasLiveGamesRef.current ? 15000 : 30000,
    // Dynamic refresh interval
    refetchInterval: () => hasLiveGamesRef.current ? 15000 : 60000,
    refetchOnWindowFocus: false,
    // Keep previous data while fetching
    placeholderData: (prev) => prev,
    // Structural sharing for performance
    structuralSharing: true,
  });

  // Update live games flag
  useEffect(() => {
    if (query.data) {
      hasLiveGamesRef.current = query.data.some(
        (g) => g.status === 'live' || g.status === 'in_progress'
      );
    }
  }, [query.data]);

  // Show mock data warning in useEffect to prevent infinite loops
  useEffect(() => {
    if (query.data?.some((g) => g.source === "Mock") && !hasShownMockToast.current) {
      hasShownMockToast.current = true;
      toast({
        title: "Mock Data Active",
        description: "Live data unavailable — showing mock results.",
        variant: "destructive",
      });
    }
  }, [query.data]);

  // Throttled refetch to prevent rapid calls
  const throttledRefetch = useMemo(
    () => throttle(() => {
      gameCache.invalidate(GAMES_CACHE_KEY);
      query.refetch();
    }, 5000),
    [query]
  );

  // Prefetch for navigation
  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ["games"],
      queryFn: fetchGamesWithCache,
    });
  }, [queryClient]);

  // Categorized games with memoization
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

  return {
    games: query.data ?? [],
    liveGames,
    upcomingGames,
    finishedGames,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: throttledRefetch,
    prefetch,
    hasLiveGames: hasLiveGamesRef.current,
  };
};
