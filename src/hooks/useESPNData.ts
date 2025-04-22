import { useState, useEffect } from "react";
import { Match, League } from "@/types";
import { fetchESPNEvents, fetchAllESPNEvents } from "@/services/espnApi";
import { useDataSource } from "./useDataSourceManager";
import { useMatchVerification } from "./useMatchVerification";

interface UseESPNDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  defaultSource?: 'ESPN' | 'MLB' | 'ACTION' | 'API';
  useExternalApis?: boolean;
}

export function useESPNData({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
  defaultSource = 'ESPN',
  useExternalApis = false,
}: UseESPNDataOptions = {}) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date().toISOString());

  const { 
    dataSource, 
    setDataSource, 
    availableDataSources 
  } = useDataSource(defaultSource);

  const { 
    verifiedMatches, 
    lastVerificationTime 
  } = useMatchVerification(allMatches, dataSource, useExternalApis);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let matches: Match[] = [];
      if (league === "ALL") {
        matches = await fetchAllESPNEvents();
      } else {
        matches = await fetchESPNEvents(league);
      }
      setAllMatches(matches);
      setLastRefreshTime(new Date().toISOString());
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchData();
  };

  const refetchWithTimestamp = () => {
    fetchData();
    setLastRefreshTime(new Date().toISOString());
  };

  useEffect(() => {
    if (includeSchedule) {
      fetchData();
    }

    if (refreshInterval) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, includeSchedule, refreshInterval]);

  return {
    allMatches,
    verifiedMatches,
    upcomingMatches: verifiedMatches.filter(m => m.status === "scheduled" || m.status === "pre"),
    liveMatches: verifiedMatches.filter(m => m.status === "live"),
    finishedMatches: verifiedMatches.filter(m => m.status === "finished"),
    isLoading,
    error,
    refetch,
    refetchWithTimestamp,
    lastRefreshTime,
    lastVerificationTime,
    dataSource,
    setDataSource,
    availableDataSources
  };
}
