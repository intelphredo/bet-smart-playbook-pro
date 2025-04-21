import { useState } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { DataSource, League, Match, DivisionStanding } from "@/types/sports";
import { useActionNetworkData } from "./useActionNetworkData";

interface UseSportsDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  includeTeams?: boolean;
  includePlayerStats?: boolean;
  includeStandings?: boolean;
  teamId?: string;
  defaultSource?: DataSource;
}

export function useSportsData({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
  includeTeams = false,
  includePlayerStats = false,
  includeStandings = false,
  teamId,
  defaultSource = "ESPN"
}: UseSportsDataOptions = {}) {
  // State to track which data source to use
  const [dataSource, setDataSource] = useState<DataSource>(defaultSource);
  
  // Get ESPN data
  const {
    allMatches: espnMatches,
    upcomingMatches: espnUpcomingMatches,
    liveMatches: espnLiveMatches,
    finishedMatches: espnFinishedMatches,
    isLoading: isLoadingESPN,
    error: espnError,
    refetch: refetchESPN
  } = useESPNData({
    league,
    refreshInterval,
    includeSchedule
  });
  
  // Get MLB data
  const {
    allMatches: mlbMatches,
    upcomingMatches: mlbUpcomingMatches,
    liveMatches: mlbLiveMatches,
    finishedMatches: mlbFinishedMatches,
    isLoadingSchedule: isLoadingMLB,
    scheduleError: mlbError,
    refetchSchedule: refetchMLB,
    divisionsStandings,
    isLoadingStandings,
    standingsError,
    fetchLiveGameData
  } = useMLBData({
    refreshInterval,
    includeTeams,
    includePlayerStats,
    includeStandings,
    teamId
  });

  // New: Action Network
  const {
    allMatches: anMatches,
    upcomingMatches: anUpcomingMatches,
    liveMatches: anLiveMatches,
    finishedMatches: anFinishedMatches,
    isLoading: isLoadingAN,
    error: anError,
    refetch: refetchAN
  } = useActionNetworkData({
    league,
    refreshInterval,
    includeSchedule
  });
  
  // Log matches for debugging
  console.log('ESPN upcoming matches:', espnUpcomingMatches.length);
  console.log('MLB upcoming matches:', mlbUpcomingMatches.length);
  
  // Determine which data set to use, now with Action
  let baseMatches, baseUpcomingMatches, baseLiveMatches, baseFinishedMatches, isLoading, error, refetchSchedule, divisionsStandings, isLoadingStandings, standingsError, fetchLiveGameData;
  if (dataSource === "ACTION") {
    baseMatches = anMatches;
    baseUpcomingMatches = anUpcomingMatches;
    baseLiveMatches = anLiveMatches;
    baseFinishedMatches = anFinishedMatches;
    isLoading = isLoadingAN;
    error = anError;
    refetchSchedule = refetchAN;
    divisionsStandings = [];
    isLoadingStandings = false;
    standingsError = null;
    fetchLiveGameData = undefined;
  } else if (dataSource === "MLB") {
    // ... MLB path as before ...
    baseMatches = mlbMatches;
    baseUpcomingMatches = mlbUpcomingMatches;
    baseLiveMatches = mlbLiveMatches;
    baseFinishedMatches = mlbFinishedMatches;
    isLoading = isLoadingMLB;
    error = mlbError;
    refetchSchedule = refetchMLB;
    divisionsStandings = divisionsStandings;
    isLoadingStandings = isLoadingStandings;
    standingsError = standingsError;
    fetchLiveGameData = fetchLiveGameData;
  } else { // ESPN default
    baseMatches = espnMatches;
    baseUpcomingMatches = espnUpcomingMatches;
    baseLiveMatches = espnLiveMatches;
    baseFinishedMatches = espnFinishedMatches;
    isLoading = isLoadingESPN;
    error = espnError;
    refetchSchedule = refetchESPN;
    divisionsStandings = [];
    isLoadingStandings = false;
    standingsError = null;
    fetchLiveGameData = undefined;
  }
  
  // Filter MLB-only data if ESPN is selected but league is MLB
  const allMatches = (() => {
    if (dataSource === "ESPN" && league === "MLB") {
      return baseMatches.filter(match => match.league === "MLB");
    }
    return baseMatches;
  })();
  
  const upcomingMatches = (() => {
    if (dataSource === "ESPN" && league === "MLB") {
      return baseUpcomingMatches.filter(match => match.league === "MLB");
    }
    return baseUpcomingMatches;
  })();
  
  const liveMatches = (() => {
    if (dataSource === "ESPN" && league === "MLB") {
      return baseLiveMatches.filter(match => match.league === "MLB");
    }
    return baseLiveMatches;
  })();
  
  const finishedMatches = (() => {
    if (dataSource === "ESPN" && league === "MLB") {
      return baseFinishedMatches.filter(match => match.league === "MLB");
    }
    return baseFinishedMatches;
  })();
  
  // If MLB is the selected league, prioritize MLB data source
  if (league === "MLB" && dataSource !== "MLB") {
    setDataSource("MLB");
  }
  
  // Normalize the return structure between ESPN and MLB data sources
  
  // For ESPN, return empty standings data since it doesn't provide that
  const normalizedDivisionsStandings = dataSource === "ESPN" ? [] : divisionsStandings;
  const normalizedIsLoadingStandings = dataSource === "ESPN" ? false : isLoadingStandings;
  const normalizedStandingsError = dataSource === "ESPN" ? null : standingsError;
  
  return {
    dataSource,
    setDataSource,
    upcomingMatches: baseUpcomingMatches,
    liveMatches: baseLiveMatches,
    finishedMatches: baseFinishedMatches,
    allMatches: baseMatches,
    isLoading,
    error,
    refetchSchedule,
    divisionsStandings,
    isLoadingStandings,
    standingsError,
    fetchLiveGameData,
  };
}
