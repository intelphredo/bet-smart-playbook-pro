import { useState, useMemo, useEffect } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { useSportsApiData } from "./useSportsApiData";
import { useActionNetworkData } from "./useActionNetworkData";
import { DataSource, League } from "@/types/sports";

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
  const [dataSource, setDataSource] = useState<DataSource>(defaultSource);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());

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

  let baseMatches, baseUpcomingMatches, baseLiveMatches, baseFinishedMatches, isLoading, error, refetchSchedule;
  let selectedDivisionsStandings, selectedIsLoadingStandings, selectedStandingsError, selectedFetchLiveGameData;

  if (useExternalApis && dataSource === "API") {
    baseMatches = apiMatches;
    baseUpcomingMatches = apiUpcomingMatches;
    baseLiveMatches = apiLiveMatches;
    baseFinishedMatches = apiFinishedMatches;
    isLoading = isLoadingApi;
    error = apiError;
    refetchSchedule = refetchApi;
    selectedDivisionsStandings = [];
    selectedIsLoadingStandings = false;
    selectedStandingsError = null;
    selectedFetchLiveGameData = undefined;
  } else if (dataSource === "ACTION") {
    baseMatches = anMatches;
    baseUpcomingMatches = anUpcomingMatches;
    baseLiveMatches = anLiveMatches;
    baseFinishedMatches = anFinishedMatches;
    isLoading = isLoadingAN;
    error = anError;
    refetchSchedule = refetchAN;
    selectedDivisionsStandings = [];
    selectedIsLoadingStandings = false;
    selectedStandingsError = null;
    selectedFetchLiveGameData = undefined;
  } else if (dataSource === "MLB") {
    baseMatches = mlbMatches;
    baseUpcomingMatches = mlbUpcomingMatches;
    baseLiveMatches = mlbLiveMatches;
    baseFinishedMatches = mlbFinishedMatches;
    isLoading = isLoadingMLB;
    error = mlbError;
    refetchSchedule = refetchMLB;
    selectedDivisionsStandings = mlbDivisionsStandings;
    selectedIsLoadingStandings = mlbIsLoadingStandings;
    selectedStandingsError = mlbStandingsError;
    selectedFetchLiveGameData = mlbFetchLiveGameData;
  } else {
    baseMatches = espnMatches;
    baseUpcomingMatches = espnUpcomingMatches;
    baseLiveMatches = espnLiveMatches;
    baseFinishedMatches = espnFinishedMatches;
    isLoading = isLoadingESPN;
    error = espnError;
    refetchSchedule = refetchESPN;
    selectedDivisionsStandings = [];
    selectedIsLoadingStandings = false;
    selectedStandingsError = null;
    selectedFetchLiveGameData = undefined;
  }

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

  if (league === "MLB" && dataSource !== "MLB") {
    setDataSource("MLB");
  }

  let availableDataSources = ['ESPN', 'ACTION', 'MLB'];
  if (useExternalApis) {
    availableDataSources.push('API');
  }

  const verifiedMatches = useMemo(() => {
    if (!useExternalApis || dataSource !== "ALL") {
      return allMatches.map(match => ({
        ...match,
        verification: {
          isVerified: true,
          confidenceScore: 100,
          lastUpdated: lastRefreshTime,
          sources: [dataSource]
        }
      }));
    }

    return allMatches.map(match => {
      const matchInSources = [
        { name: "ESPN", data: espnMatches.find(m => m.id === match.id) },
        { name: "API", data: apiMatches.find(m => m.id === match.id) },
        { name: "ACTION", data: anMatches.find(m => m.id === match.id) }
      ].filter(source => source.data) as { name: string; data: Match }[];

      const verification = verifyMatchData(match, matchInSources);
      
      return {
        ...match,
        verification,
        lastUpdated: lastRefreshTime
      };
    });
  }, [allMatches, espnMatches, apiMatches, anMatches, dataSource, useExternalApis, lastRefreshTime]);

  const refetchWithTimestamp = async () => {
    await refetchSchedule();
    setLastRefreshTime(new Date().toISOString());
  };

  useEffect(() => {
    refetchWithTimestamp();
    const intervalId = setInterval(refetchWithTimestamp, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return {
    dataSource,
    setDataSource,
    availableDataSources,
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
