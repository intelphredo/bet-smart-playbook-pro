
import { useEffect } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { useSportsApiData } from "./useSportsApiData";
import { useActionNetworkData } from "./useActionNetworkData";
import { useDataSourceManager } from "./useDataSourceManager";
import { useMatchVerification } from "./useMatchVerification";
import { useMatchesByStatus } from "./useMatchesByStatus";
import { useAutoRefresh } from "./useAutoRefresh";
import { useLeagueData } from "./useLeagueData";
import { useMatchFiltering } from "./useMatchFiltering";
import { UseSportsDataOptions } from "./types/sportsDataTypes";

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
    isLoading: isLoadingESPN,
    error: espnError,
    refetch: refetchESPN
  } = useESPNData({ league, refreshInterval, includeSchedule });

  const {
    allMatches: mlbMatches,
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
    isLoading: isLoadingAN,
    error: anError,
    refetch: refetchAN
  } = useActionNetworkData({ league, refreshInterval, includeSchedule });

  const {
    allMatches: apiMatches,
    isLoading: isLoadingApi,
    error: apiError,
    refetch: refetchApi
  } = useSportsApiData({ league, refreshInterval, dataSource: preferredApiSource });

  const {
    baseMatches,
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
    { allMatches: apiMatches, isLoading: isLoadingApi, error: apiError, refetch: refetchApi },
    { allMatches: anMatches, isLoading: isLoadingAN, error: anError, refetch: refetchAN },
    { allMatches: mlbMatches, isLoadingSchedule: isLoadingMLB, scheduleError: mlbError, refetchSchedule: refetchMLB, divisionsStandings: mlbDivisionsStandings, isLoadingStandings: mlbIsLoadingStandings, standingsError: mlbStandingsError, fetchLiveGameData: mlbFetchLiveGameData },
    { allMatches: espnMatches, isLoading: isLoadingESPN, error: espnError, refetch: refetchESPN }
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

  const filteredMatches = useLeagueData(verifiedMatches, league);
  const { upcomingMatches, liveMatches, finishedMatches } = useMatchFiltering(filteredMatches);

  const refetchWithTimestamp = async () => {
    await refetchSchedule();
    updateLastRefreshTime();
  };

  useAutoRefresh(refreshInterval, refetchWithTimestamp);

  if (league === "MLB" && dataSource !== "MLB") {
    setDataSource("MLB");
  }

  return {
    dataSource,
    setDataSource,
    availableDataSources: getAvailableDataSources(useExternalApis),
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: filteredMatches,
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
