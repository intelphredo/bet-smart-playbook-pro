import { useEffect } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { useSportsApiData } from "./useSportsApiData";
import { useActionNetworkData } from "./useActionNetworkData";
import { DataSource, League, Match } from "@/types/sports";
import { useDataSourceManager } from "./useDataSourceManager";
import { useMatchVerification } from "./useMatchVerification";
import { useMatchesByStatus } from "./useMatchesByStatus";

interface UseSportsDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  includeTeams?: boolean;
  includePlayerStats?: boolean;
  includeStandings?: boolean;
  teamId?: string;
  defaultSource?: DataSource;
  useExternalApis?: boolean;
  preferredApiSource?: 'SPORTRADAR' | 'ODDSAPI' | 'ALL';
}

export function useSportsData({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
  includeTeams = false,
  includePlayerStats = false,
  includeStandings = false,
  teamId,
  defaultSource = "ESPN",
  useExternalApis = false,
  preferredApiSource = 'ALL'
}: UseSportsDataOptions = {}) {
  const {
    dataSource,
    setDataSource,
    lastRefreshTime,
    updateLastRefreshTime,
    getAvailableDataSources
  } = useDataSourceManager(defaultSource);

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

  const {
    allMatches: mlbMatches,
    upcomingMatches: mlbUpcomingMatches,
    liveMatches: mlbLiveMatches,
    finishedMatches: mlbFinishedMatches,
    isLoadingSchedule: isLoadingMLB,
    scheduleError: mlbError,
    refetchSchedule: refetchMLB,
    divisionsStandings: mlbDivisionsStandings,
    isLoadingStandings: mlbIsLoadingStandings,
    standingsError: mlbStandingsError,
    fetchLiveGameData: mlbFetchLiveGameData
  } = useMLBData({
    refreshInterval,
    includeTeams,
    includePlayerStats,
    includeStandings,
    teamId
  });

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

  const {
    allMatches: apiMatches,
    upcomingMatches: apiUpcomingMatches,
    liveMatches: apiLiveMatches,
    finishedMatches: apiFinishedMatches,
    isLoading: isLoadingApi,
    error: apiError,
    refetch: refetchApi
  } = useSportsApiData({
    league,
    refreshInterval,
    dataSource: preferredApiSource
  });

  console.log('ESPN upcoming matches:', espnUpcomingMatches.length);
  console.log('MLB upcoming matches:', mlbUpcomingMatches.length);
  if (useExternalApis) {
    console.log('API upcoming matches:', apiUpcomingMatches.length);
  }

  const {
    baseMatches,
    baseUpcomingMatches,
    baseLiveMatches,
    baseFinishedMatches,
    isLoading,
    error,
    refetchSchedule,
    selectedDivisionsStandings,
    selectedIsLoadingStandings,
    selectedStandingsError,
    selectedFetchLiveGameData
  } = useMatchesByStatus(
    dataSource,
    useExternalApis,
    { allMatches: apiMatches, upcomingMatches: apiUpcomingMatches, liveMatches: apiLiveMatches, finishedMatches: apiFinishedMatches, isLoading: isLoadingApi, error: apiError, refetch: refetchApi },
    { allMatches: anMatches, upcomingMatches: anUpcomingMatches, liveMatches: anLiveMatches, finishedMatches: anFinishedMatches, isLoading: isLoadingAN, error: anError, refetch: refetchAN },
    { allMatches: mlbMatches, upcomingMatches: mlbUpcomingMatches, liveMatches: mlbLiveMatches, finishedMatches: mlbFinishedMatches, isLoadingSchedule: isLoadingMLB, scheduleError: mlbError, refetchSchedule: refetchMLB, divisionsStandings: mlbDivisionsStandings, isLoadingStandings: mlbIsLoadingStandings, standingsError: mlbStandingsError, fetchLiveGameData: mlbFetchLiveGameData },
    { allMatches: espnMatches, upcomingMatches: espnUpcomingMatches, liveMatches: espnLiveMatches, finishedMatches: espnFinishedMatches, isLoading: isLoadingESPN, error: espnError, refetch: refetchESPN }
  );

  const { verifiedMatches } = useMatchVerification(
    baseMatches,
    espnMatches,
    apiMatches,
    anMatches,
    dataSource,
    useExternalApis,
    lastRefreshTime
  );

  const allMatches = (() => {
    if (dataSource === "ESPN" && league === "MLB") {
      return verifiedMatches.filter(match => match.league === "MLB");
    }
    return verifiedMatches;
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

  if (league === "MLB" && dataSource !== "MLB") {
    setDataSource("MLB");
  }

  const refetchWithTimestamp = async () => {
    await refetchSchedule();
    updateLastRefreshTime();
  };

  useEffect(() => {
    refetchWithTimestamp();
    const intervalId = setInterval(refetchWithTimestamp, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return {
    dataSource,
    setDataSource,
    availableDataSources: getAvailableDataSources(useExternalApis),
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches,
    isLoading,
    error,
    refetchSchedule,
    divisionsStandings: selectedDivisionsStandings,
    isLoadingStandings: selectedIsLoadingStandings,
    standingsError: selectedStandingsError,
    fetchLiveGameData: selectedFetchLiveGameData,
    useExternalApis,
    preferredApiSource,
    verifiedMatches,
    lastRefreshTime,
    refetchWithTimestamp
  };
}
