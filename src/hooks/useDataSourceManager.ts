
import { useState, useEffect, createContext, useContext } from "react";
import { Match, League } from "@/types";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { UseSportsDataOptions } from "./types/sportsDataTypes";

// Create context for data source management
const DataSourceContext = createContext<any>(null);

export const useDataSourceContext = () => useContext(DataSourceContext);

interface DataSourceManagerProps extends UseSportsDataOptions {
  onMatchesUpdated?: (matches: Match[]) => void;
}

export function useDataSource(defaultSource: string = "ESPN") {
  const [dataSource, setDataSource] = useState(defaultSource);
  const [availableDataSources, setAvailableDataSources] = useState<string[]>(["ESPN", "MLB", "ACTION", "API"]);

  return {
    dataSource, 
    setDataSource, 
    availableDataSources
  };
}

export function useDataSourceManager(defaultSource: string = "ESPN") {
  const [dataSource, setDataSource] = useState(defaultSource);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date().toISOString());

  const updateLastRefreshTime = () => {
    setLastRefreshTime(new Date().toISOString());
  };

  const getAvailableDataSources = (useExternalApis: boolean = false) => {
    const sources = ["ESPN", "MLB"];
    if (useExternalApis) {
      sources.push("ACTION", "API");
    }
    return sources;
  };

  return {
    dataSource,
    setDataSource,
    lastRefreshTime,
    updateLastRefreshTime,
    getAvailableDataSources
  };
}

// Original DataSourceManager implementation kept for reference but not used directly
// to avoid circular dependencies
export function useDataSourceManagerOriginal({
  league = "ALL",
  refreshInterval = 60000,
  includeSchedule = true,
  includeTeams = false,
  includePlayerStats = false,
  includeStandings = false,
  teamId,
  defaultSource = "ESPN",
  useExternalApis = false,
  preferredApiSource = 'ALL',
  onMatchesUpdated = () => {},
}: DataSourceManagerProps) {
  const [dataSource, setDataSource] = useState(defaultSource);
  const [availableDataSources, setAvailableDataSources] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date().toISOString());

  // ESPN Data Hook
  const espnData = useESPNData({
    league,
    refreshInterval,
    includeSchedule,
  });

  // MLB Data Hook
  const mlbData = useMLBData({
    league,
    refreshInterval,
    includeSchedule,
    includePlayerStats,
    teamId,
  });

  useEffect(() => {
    const sources: string[] = [];
    if (espnData.allMatches.length > 0) sources.push("ESPN");
    if (mlbData.allMatches.length > 0) sources.push("MLB");
    setAvailableDataSources(sources);
  }, [espnData.allMatches.length, mlbData.allMatches.length]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    let allMatches: Match[] = [];

    if (dataSource === "ESPN") {
      allMatches = espnData.allMatches;
    } else if (dataSource === "MLB") {
      allMatches = mlbData.allMatches;
    }

    setMatches(allMatches);
    onMatchesUpdated(allMatches); // Notify parent component

    setIsLoading(false);
    setLastRefreshTime(new Date().toISOString());
  }, [dataSource, espnData.allMatches, mlbData.allMatches, onMatchesUpdated]);

  const refetchWithTimestamp = () => {
    if (dataSource === "ESPN") {
      espnData.refetch();
    } else if (dataSource === "MLB") {
      mlbData.refetch();
    }
    setLastRefreshTime(new Date().toISOString());
  };

  const verifiedMatches = matches.map(match => ({
    ...match,
    verification: {
      isVerified: true,
      confidenceScore: 95,
      lastUpdated: new Date().toISOString(),
      sources: [dataSource],
    },
  }));

  return {
    matches,
    verifiedMatches,
    isLoading,
    error,
    dataSource,
    setDataSource,
    availableDataSources,
    lastRefreshTime,
    refetchWithTimestamp,
  };
}
