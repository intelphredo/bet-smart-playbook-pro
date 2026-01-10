import { useEffect, useMemo } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { useSportsApiData } from "./useSportsApiData";
import { useActionNetworkData } from "./useActionNetworkData";
import { useOddsApi } from "./useOddsApi";
import { DataSource, League, Match, LiveOdds } from "@/types/sports";
import { useDataSourceManager } from "./useDataSourceManager";
import { useMatchVerification } from "./useMatchVerification";
import { useMatchesByStatus } from "./useMatchesByStatus";
import { getESPNDataStatus } from "@/services/espnApi";
import { isSameGame, dedupeMatches } from "@/utils/teamMatching";

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

  // Fetch real odds from The Odds API
  const {
    matches: oddsApiMatches,
    isLoading: isLoadingOdds,
    isError: isOddsError,
  } = useOddsApi(league);

  console.log('ESPN upcoming matches:', espnUpcomingMatches.length);
  console.log('MLB upcoming matches:', mlbUpcomingMatches.length);
  console.log('Odds API matches:', oddsApiMatches.length);
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

  // Combine ESPN/base matches with Odds API matches for better coverage
  const upcomingMatches = useMemo(() => {
    let base = baseUpcomingMatches;
    if (dataSource === "ESPN" && league === "MLB") {
      base = base.filter(match => match.league === "MLB");
    }
    
    // Add Odds API upcoming matches that aren't in base data
    const oddsUpcoming = oddsApiMatches.filter(m => m.status === "scheduled");
    const combined = [...base, ...oddsUpcoming];
    
    return dedupeMatches(combined);
  }, [baseUpcomingMatches, oddsApiMatches, dataSource, league]);

  const liveMatches = useMemo(() => {
    let base = baseLiveMatches;
    if (dataSource === "ESPN" && league === "MLB") {
      base = base.filter(match => match.league === "MLB");
    }
    
    // Add Odds API live matches that aren't in base data
    const oddsLive = oddsApiMatches.filter(m => m.status === "live");
    const combined = [...base, ...oddsLive];
    
    console.log('=== Live Games Debug ===');
    console.log('ESPN/Base live:', base.length);
    console.log('Odds API live:', oddsLive.length);
    console.log('Combined before dedup:', combined.length);
    
    const deduped = dedupeMatches(combined);
    console.log('Combined after dedup:', deduped.length);
    
    return deduped;
  }, [baseLiveMatches, oddsApiMatches, dataSource, league]);

  const finishedMatches = useMemo(() => {
    let base = baseFinishedMatches;
    if (dataSource === "ESPN" && league === "MLB") {
      base = base.filter(match => match.league === "MLB");
    }
    
    // Add Odds API finished matches that aren't in base data
    const oddsFinished = oddsApiMatches.filter(m => m.status === "finished");
    const combined = [...base, ...oddsFinished];
    
    return dedupeMatches(combined);
  }, [baseFinishedMatches, oddsApiMatches, dataSource, league]);

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

  // Merge ESPN matches with Odds API data for real sportsbook odds
  const matchesWithOdds = useMemo(() => {
    if (!oddsApiMatches.length) return allMatches;
    
    return allMatches.map(match => {
      // Find matching odds data by team names
      const oddsMatch = oddsApiMatches.find(om => {
        const homeMatch = om.homeTeam.name.toLowerCase().includes(match.homeTeam.name.toLowerCase().split(' ').pop() || '') ||
                          match.homeTeam.name.toLowerCase().includes(om.homeTeam.name.toLowerCase().split(' ').pop() || '');
        const awayMatch = om.awayTeam.name.toLowerCase().includes(match.awayTeam.name.toLowerCase().split(' ').pop() || '') ||
                          match.awayTeam.name.toLowerCase().includes(om.awayTeam.name.toLowerCase().split(' ').pop() || '');
        return homeMatch && awayMatch;
      });

      if (oddsMatch && oddsMatch.liveOdds) {
        return {
          ...match,
          liveOdds: oddsMatch.liveOdds,
          odds: oddsMatch.odds,
        };
      }
      return match;
    });
  }, [allMatches, oddsApiMatches]);

  // Get ESPN data status for the DataSourceBadge
  const espnDataStatus = useMemo(() => {
    const status = getESPNDataStatus();
    return {
      source: status.source,
      lastUpdated: status.lastUpdated,
      gamesLoaded: matchesWithOdds.length,
      errors: status.errors
    };
  }, [matchesWithOdds.length, lastRefreshTime]);

  // Odds API status
  const oddsApiStatus = useMemo(() => ({
    isLoading: isLoadingOdds,
    isError: isOddsError,
    matchCount: oddsApiMatches.length,
    hasData: oddsApiMatches.length > 0,
  }), [isLoadingOdds, isOddsError, oddsApiMatches.length]);

  return {
    dataSource,
    setDataSource,
    availableDataSources: getAvailableDataSources(useExternalApis),
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: matchesWithOdds,
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
    refetchWithTimestamp,
    espnDataStatus,
    oddsApiStatus,
    oddsApiMatches,
  };
}
