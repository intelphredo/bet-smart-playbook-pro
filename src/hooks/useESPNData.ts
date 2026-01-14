import { useQuery } from "@tanstack/react-query";
import { Match, League } from "@/types/sports";
import { fetchESPNEvents, fetchAllESPNEvents, fetchLeagueSchedule, fetchAllSchedules } from "@/services/espnApi";
import { useMemo, useState, useEffect, useCallback } from "react";

interface UseESPNDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  liveRefreshInterval?: number; // Faster refresh for live games
  includeSchedule?: boolean;
  daysAhead?: number;
}

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

  // Use faster interval when live games exist
  const activeInterval = hasLiveGames ? liveRefreshInterval : refreshInterval;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['espn-data', league, includeSchedule, daysAhead],
    queryFn: async () => {
      const result = await (includeSchedule
        ? (league === "ALL" ? fetchAllSchedules(daysAhead) : fetchLeagueSchedule(league as League))
        : (league === "ALL" ? fetchAllESPNEvents() : fetchESPNEvents(league as League)));
      
      setLastRefresh(new Date());
      return result;
    },
    refetchInterval: activeInterval,
    staleTime: activeInterval / 2,
    // Keep previous data while refetching to prevent flicker
    placeholderData: (previousData) => previousData,
    // Don't refetch on window focus to prevent data loss
    refetchOnWindowFocus: false,
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
    setHasLiveGames(liveMatches.length > 0);
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

  const forceRefresh = useCallback(() => {
    refetch();
    setLastRefresh(new Date());
  }, [refetch]);

  return {
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: data || [],
    isLoading,
    isFetching,
    error,
    refetch: forceRefresh,
    // Auto-refresh metadata
    hasLiveGames,
    lastRefresh,
    secondsUntilRefresh,
    activeInterval,
  };
}
