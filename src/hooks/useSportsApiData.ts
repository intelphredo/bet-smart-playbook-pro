import { useState, useEffect } from "react";
import { Match, League } from "@/types";
import { fetchESPNEvents, fetchAllESPNEvents } from "@/services/espnApi";
import { fetchOddsApiData, fetchAllOddsApiData } from "@/services/oddsApi";
import { fetchSportRadarSchedule, fetchAllSportRadarSchedules } from "@/services/sportRadarApi";
import { useDataSourceContext } from "./useDataSourceManager";
import { useMatchVerification } from "./useMatchVerification";

interface UseSportsApiDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  defaultSource?: 'ESPN' | 'MLB' | 'ACTION' | 'API';
  useExternalApis?: boolean;
  preferredApiSource?: 'SPORTRADAR' | 'ODDSAPI' | 'ALL';
}

export function useSportsApiData({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
  useExternalApis = true,
  preferredApiSource = 'ALL',
}: UseSportsApiDataOptions = {}) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date().toISOString());
  const { dataSource, setDataSource, availableDataSources } = useDataSourceContext();
  const { verifiedMatches, verificationLoading, verificationError } = useMatchVerification(allMatches);

  // Function to fetch data from external APIs based on preferred source
  const fetchDataFromApis = async (): Promise<Match[]> => {
    if (!useExternalApis) return [];

    setIsLoading(true);
    setError(null);

    try {
      let matches: Match[] = [];

      if (preferredApiSource === 'SPORTRADAR' || preferredApiSource === 'ALL') {
        const sportRadarMatches = league === "ALL" ? await fetchAllSportRadarSchedules() : await fetchSportRadarSchedule(league);
        matches = [...matches, ...sportRadarMatches];
      }

      if (preferredApiSource === 'ODDSAPI' || preferredApiSource === 'ALL') {
        const oddsApiMatches = league === "ALL" ? await fetchAllOddsApiData() : await fetchOddsApiData(league);
        matches = [...matches, ...oddsApiMatches];
      }

      return matches;
    } catch (e: any) {
      setError(e);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch data from ESPN API
  const fetchESPNData = async (): Promise<Match[]> => {
    setIsLoading(true);
    setError(null);

    try {
      let matches: Match[] = [];

      if (league === "ALL") {
        matches = await fetchAllESPNEvents();
      } else {
        matches = await fetchESPNEvents(league);
      }

      return matches;
    } catch (e: any) {
      setError(e);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Generic refetch function
  const refetch = async () => {
    if (!includeSchedule) return;

    let matches: Match[] = [];

    if (dataSource === "ESPN") {
      matches = await fetchESPNData();
    } else {
      matches = await fetchDataFromApis();
    }

    setAllMatches(matches);
    setLastRefreshTime(new Date().toISOString());
  };

  // Refetch with timestamp to force refresh
  const refetchWithTimestamp = () => {
    setLastRefreshTime(new Date().toISOString());
  };

  useEffect(() => {
    refetch(); // Initial fetch
    if (refreshInterval) {
      const intervalId = setInterval(refetch, refreshInterval);
      return () => clearInterval(intervalId); // Clean up interval on unmount
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, includeSchedule, refreshInterval, dataSource, lastRefreshTime]);

  return {
    allMatches,
    verifiedMatches,
    isLoading,
    error,
		verificationLoading,
		verificationError,
    refetch,
    refetchWithTimestamp,
    lastRefreshTime,
    dataSource,
    setDataSource,
    availableDataSources
  };
}
