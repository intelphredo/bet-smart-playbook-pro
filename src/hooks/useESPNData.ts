
import { useQuery } from "@tanstack/react-query";
import { Match, League } from "@/types/sports";
import { fetchESPNEvents, fetchAllESPNEvents, fetchLeagueSchedule, fetchAllSchedules } from "@/services/espnService";
import { useMemo } from "react";

interface UseESPNDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
}

export function useESPNData({ 
  league = "ALL", 
  refreshInterval = 60000, // Default refresh every minute
  includeSchedule = true // Changed default to true to always get full schedule
}: UseESPNDataOptions = {}) {

  // Fetch data based on selected league and whether to include full schedule
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['espn-data', league, includeSchedule],
    queryFn: () => {
      if (includeSchedule) {
        return league === "ALL" ? fetchAllSchedules() : fetchLeagueSchedule(league as League);
      } else {
        return league === "ALL" ? fetchAllESPNEvents() : fetchESPNEvents(league as League);
      }
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
  });

  // Split matches into upcoming, live, and finished
  const { upcomingMatches, liveMatches, finishedMatches } = useMemo(() => {
    const live = data?.filter(match => match.status === "live") || [];
    const upcoming = data?.filter(match => match.status === "scheduled") || [];
    const finished = data?.filter(match => match.status === "finished") || [];
    return { upcomingMatches: upcoming, liveMatches: live, finishedMatches: finished };
  }, [data]);

  return {
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: data || [],
    isLoading,
    error,
    refetch
  };
}
