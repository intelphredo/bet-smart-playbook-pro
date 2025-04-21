
import { useQuery } from "@tanstack/react-query";
import { Match, League } from "@/types/sports";
import { fetchESPNEvents, fetchAllESPNEvents } from "@/services/espnService";
import { useMemo } from "react";

interface UseESPNDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
}

export function useESPNData({ 
  league = "ALL", 
  refreshInterval = 60000 // Default refresh every minute
}: UseESPNDataOptions = {}) {

  // Fetch data based on selected league
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['espn-data', league],
    queryFn: () => league === "ALL" ? fetchAllESPNEvents() : fetchESPNEvents(league as League),
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
