import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Match, League } from "@/types/sports";
import { fetchESPNEvents, fetchAllESPNEvents, fetchLeagueSchedule, fetchAllSchedules } from "@/services/espnApi";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { gameCache } from "@/utils/cache/cacheManager";
import { throttle } from "@/utils/cache/updateBatcher";

interface UseESPNDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  liveRefreshInterval?: number; // Faster refresh for live games
  includeSchedule?: boolean;
  daysAhead?: number;
}

// Generate cache key for ESPN data
const getEspnCacheKey = (league: League | "ALL", includeSchedule: boolean, daysAhead: number) => 
  `espn-data-${league}-${includeSchedule}-${daysAhead}`;

export function useESPNData({ 
  league = "ALL", 
  refreshInterval = 60000,
  liveRefreshInterval = 15000, // 15 seconds for live games
  includeSchedule = true,
  daysAhead = 7
}: UseESPNDataOptions = {}) {
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(0);
  const queryClient = useQueryClient();
  const hasLiveGamesRef = useRef(false);

  // Use faster interval when live games exist
  const activeInterval = hasLiveGames ? liveRefreshInterval : refreshInterval;
  const cacheKey = getEspnCacheKey(league, includeSchedule, daysAhead);

  // Fetch function with SWR caching
  const fetchData = useCallback(async () => {
    return gameCache.swr(
      cacheKey,
      async () => {
        const result = await (includeSchedule
          ? (league === "ALL" ? fetchAllSchedules(daysAhead) : fetchLeagueSchedule(league as League))
          : (league === "ALL" ? fetchAllESPNEvents() : fetchESPNEvents(league as League)));
        return result;
      },
      {
        ttl: refreshInterval,
        staleTime: liveRefreshInterval,
      }
    );
  }, [cacheKey, league, includeSchedule, daysAhead, refreshInterval, liveRefreshInterval]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['espn-data', league, includeSchedule, daysAhead],
    queryFn: async () => {
      const result = await fetchData();
      setLastRefresh(new Date());
      return result;
    },
    refetchInterval: () => hasLiveGamesRef.current ? liveRefreshInterval : refreshInterval,
    staleTime: () => hasLiveGamesRef.current ? liveRefreshInterval / 2 : refreshInterval / 2,
    // Keep previous data while refetching to prevent flicker
    placeholderData: (previousData) => previousData,
    // Don't refetch on window focus to prevent data loss
    refetchOnWindowFocus: false,
    // Structural sharing for performance
    structuralSharing: true,
  });

  const { upcomingMatches, liveMatches, finishedMatches } = useMemo(() => {
    if (!Array.isArray(data)) {
      return { upcomingMatches: [], liveMatches: [], finishedMatches: [] };
    }
    
    const live = data.filter(match => match.status === "live") || [];
    const upcoming = data.filter(match => match.status === "scheduled" || match.status === "pre") || [];
    const finished = data.filter(match => match.status === "finished") || [];
    
    upcoming.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    finished.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    return { upcomingMatches: upcoming, liveMatches: live, finishedMatches: finished };
  }, [data]);

  // Update hasLiveGames when live matches change
  useEffect(() => {
    const hasLive = liveMatches.length > 0;
    setHasLiveGames(hasLive);
    hasLiveGamesRef.current = hasLive;
  }, [liveMatches.length]);

  // Countdown timer for next refresh
  useEffect(() => {
    const updateCountdown = () => {
      const elapsed = Date.now() - lastRefresh.getTime();
      const remaining = Math.max(0, Math.ceil((activeInterval - elapsed) / 1000));
      setSecondsUntilRefresh(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [lastRefresh, activeInterval]);

  // Throttled force refresh
  const forceRefresh = useMemo(
    () => throttle(() => {
      gameCache.invalidate(cacheKey);
      refetch();
      setLastRefresh(new Date());
    }, 5000),
    [refetch, cacheKey]
  );

  // Prefetch for navigation
  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['espn-data', league, includeSchedule, daysAhead],
      queryFn: fetchData,
    });
  }, [queryClient, league, includeSchedule, daysAhead, fetchData]);

  return {
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: data || [],
    isLoading,
    isFetching,
    error,
    refetch: forceRefresh,
    prefetch,
    // Auto-refresh metadata
    hasLiveGames,
    lastRefresh,
    secondsUntilRefresh,
    activeInterval,
  };
}
