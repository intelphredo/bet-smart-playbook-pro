
import { useQuery } from "@tanstack/react-query";
import { Match, League } from "@/types/sports";
import { fetchAllSportRadarSchedules, fetchSportRadarSchedule } from "@/services/sportRadarApi";
import { fetchAllOddsApiData, fetchOddsApiData } from "@/services/oddsApi";
import { useMemo } from "react";

interface UseSportsApiDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  dataSource?: 'SPORTRADAR' | 'ODDSAPI' | 'ALL';
}

export function useSportsApiData({
  league = "ALL",
  refreshInterval = 60000,
  dataSource = 'ALL'
}: UseSportsApiDataOptions = {}) {
  // Fetch SportRadar data if selected
  const {
    data: sportRadarData,
    isLoading: isLoadingSportRadar,
    error: sportRadarError,
    refetch: refetchSportRadar
  } = useQuery({
    queryKey: ['sportradar-data', league],
    queryFn: () => {
      if (dataSource === 'ODDSAPI') return Promise.resolve([]); // Skip if not selected
      return league === "ALL" ? fetchAllSportRadarSchedules() : fetchSportRadarSchedule(league as League);
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
    enabled: dataSource !== 'ODDSAPI'
  });

  // Fetch OddsAPI data if selected
  const {
    data: oddsApiData,
    isLoading: isLoadingOddsApi,
    error: oddsApiError,
    refetch: refetchOddsApi
  } = useQuery({
    queryKey: ['oddsapi-data', league],
    queryFn: () => {
      if (dataSource === 'SPORTRADAR') return Promise.resolve([]); // Skip if not selected
      return league === "ALL" ? fetchAllOddsApiData() : fetchOddsApiData(league as League);
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
    enabled: dataSource !== 'SPORTRADAR'
  });

  // Merge data from all sources and filter for the selected league
  const matches = useMemo(() => {
    let allMatches: Match[] = [];
    
    // Add SportRadar data
    if (sportRadarData && dataSource !== 'ODDSAPI') {
      allMatches = [...allMatches, ...sportRadarData];
    }
    
    // Add OddsAPI data
    if (oddsApiData && dataSource !== 'SPORTRADAR') {
      allMatches = [...allMatches, ...oddsApiData];
    }
    
    // Filter by league if not "ALL"
    if (league !== "ALL") {
      allMatches = allMatches.filter(match => match.league === league);
    }
    
    // Log the match count
    console.log(`Combined API data: ${allMatches.length} matches`);
    
    return allMatches;
  }, [sportRadarData, oddsApiData, league, dataSource]);

  // Sort matches by scheduled time
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [matches]);

  // Separate matches by status
  const { upcomingMatches, liveMatches, finishedMatches } = useMemo(() => {
    if (!sortedMatches.length) {
      return { upcomingMatches: [], liveMatches: [], finishedMatches: [] };
    }
    
    const upcoming = sortedMatches.filter(match => match.status === "scheduled" || match.status === "pre");
    const live = sortedMatches.filter(match => match.status === "live");
    const finished = sortedMatches.filter(match => match.status === "finished");
    
    return { upcomingMatches: upcoming, liveMatches: live, finishedMatches: finished };
  }, [sortedMatches]);

  // Combine loading and error states
  const isLoading = isLoadingSportRadar || isLoadingOddsApi;
  const error = sportRadarError || oddsApiError;

  // Combined refetch function
  const refetch = () => {
    if (dataSource !== 'ODDSAPI') refetchSportRadar();
    if (dataSource !== 'SPORTRADAR') refetchOddsApi();
  };

  return {
    allMatches: sortedMatches,
    upcomingMatches,
    liveMatches,
    finishedMatches,
    isLoading,
    error,
    refetch,
    dataSource,
    sportRadarData: sportRadarData || [],
    oddsApiData: oddsApiData || []
  };
}
