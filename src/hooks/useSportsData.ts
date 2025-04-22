
import { useEffect } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { useSportsApiData } from "./useSportsApiData";
import { useActionNetworkData } from "./useActionNetworkData";
import { useDataSourceManager, useDataSource } from "./useDataSourceManager";
import { verifyMatches } from "./useMatchVerification";
import { useMatchesByStatus, useMatchesByStatusMultiSource } from "./useMatchesByStatus";
import { useAutoRefresh } from "./useAutoRefresh";
import { useLeagueData } from "./useLeagueData";
import { useMatchFiltering } from "./useMatchFiltering";
import { UseSportsDataOptions } from "./types/sportsDataTypes";
import { Match } from "@/types";

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
    isLoading: isLoadingMLB,
    error: mlbError,
    refetch: refetchMLB,
    divisionsStandings: mlbDivisionsStandings,
    isLoadingStandings: mlbIsLoadingStandings,
    standingsError: mlbStandingsError,
    fetchLiveGameData: mlbFetchLiveGameData
  } = useMLBData({
    league,
    refreshInterval,
    includeSchedule,
    includePlayerStats
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
  } = useSportsApiData({ 
    league, 
    refreshInterval, 
    preferredApiSource,
    dataSource 
  });

  // Get appropriate data based on selected data source
  const multiSourceData = useMatchesByStatusMultiSource(
    dataSource,
    useExternalApis,
    { allMatches: apiMatches, isLoading: isLoadingApi, error: apiError, refetch: refetchApi },
    { allMatches: anMatches, isLoading: isLoadingAN, error: anError, refetch: refetchAN },
    { 
      allMatches: mlbMatches, 
      isLoadingSchedule: isLoadingMLB, 
      scheduleError: mlbError, 
      refetchSchedule: refetchMLB, 
      divisionsStandings: mlbDivisionsStandings, 
      isLoadingStandings: mlbIsLoadingStandings, 
      standingsError: mlbStandingsError, 
      fetchLiveGameData: mlbFetchLiveGameData 
    },
    { allMatches: espnMatches, isLoading: isLoadingESPN, error: espnError, refetch: refetchESPN }
  );

  // Apply verification to all matches from the selected data source
  const verifiedMatches = verifyMatches(multiSourceData.baseMatches || [], dataSource);

  // Filter based on selected league if needed
  const filteredMatches = league === "ALL" ? 
    verifiedMatches : 
    verifiedMatches.filter(match => match.league === league);

  // Get matches by status
  const { upcomingMatches, liveMatches, finishedMatches } = useMatchesByStatus(filteredMatches);

  // Refetch function that updates timestamp
  const refetchWithTimestamp = async () => {
    await multiSourceData.refetchSchedule();
    updateLastRefreshTime();
  };

  // Set up auto refresh if interval provided
  useAutoRefresh(refreshInterval, refetchWithTimestamp);

  // Switch to MLB source if viewing MLB data
  useEffect(() => {
    if (league === "MLB" && dataSource !== "MLB") {
      setDataSource("MLB");
    }
  }, [league, dataSource, setDataSource]);

  return {
    dataSource,
    setDataSource,
    availableDataSources: getAvailableDataSources(useExternalApis),
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: filteredMatches,
    isLoading: multiSourceData.isLoading,
    error: multiSourceData.error,
    refetchSchedule: multiSourceData.refetchSchedule,
    divisionsStandings: multiSourceData.selectedDivisionsStandings,
    isLoadingStandings: multiSourceData.selectedIsLoadingStandings,
    standingsError: multiSourceData.selectedStandingsError,
    fetchLiveGameData: multiSourceData.selectedFetchLiveGameData,
    useExternalApis,
    preferredApiSource,
    verifiedMatches,
    lastRefreshTime,
    refetchWithTimestamp
  };
}
