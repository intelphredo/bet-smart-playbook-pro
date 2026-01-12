import { useQuery } from "@tanstack/react-query";
import { Match, League } from "@/types/sports";
import { fetchESPNEvents, fetchAllESPNEvents, fetchLeagueSchedule, fetchAllSchedules } from "@/services/espnApi";
import { useMemo } from "react";

interface UseESPNDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  daysAhead?: number;
}

export function useESPNData({ 
  league = "ALL", 
  refreshInterval = 60000,
  includeSchedule = true, // Default to true to get week-ahead data
  daysAhead = 7
}: UseESPNDataOptions = {}) {

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['espn-data', league, includeSchedule, daysAhead],
    queryFn: () => {
      if (includeSchedule) {
        // Fetch week-ahead schedule data
        return league === "ALL" 
          ? fetchAllSchedules(daysAhead) 
          : fetchLeagueSchedule(league as League);
      } else {
        // Just today's games
        return league === "ALL" 
          ? fetchAllESPNEvents() 
          : fetchESPNEvents(league as League);
      }
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
  });

  // Log raw data for debugging
  console.log('ESPN raw data length:', data?.length || 0);
  
  const { upcomingMatches, liveMatches, finishedMatches } = useMemo(() => {
    // Ensure data is an array before filtering
    if (!Array.isArray(data)) {
      console.log('ESPN data is not an array');
      return { upcomingMatches: [], liveMatches: [], finishedMatches: [] };
    }
    
    // Log match statuses for debugging
    const statuses = data.map(match => match.status);
    console.log('ESPN match statuses:', new Set(statuses));
    
    const live = data.filter(match => match.status === "live") || [];
    // Consider both "scheduled" and "pre" as upcoming matches
    const upcoming = data.filter(match => match.status === "scheduled" || match.status === "pre") || [];
    const finished = data.filter(match => match.status === "finished") || [];
    
    // Sort upcoming by start time
    upcoming.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    console.log('ESPN parsed upcoming:', upcoming.length);
    console.log('ESPN parsed live:', live.length);
    console.log('ESPN parsed finished:', finished.length);
    
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
