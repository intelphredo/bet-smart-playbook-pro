
import { useState } from "react";
import { useESPNData } from "./useESPNData";
import { useMLBData } from "./useMLBData";
import { DataSource, League, Match } from "@/types/sports";

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
  const espnData = useESPNData({
    league,
    refreshInterval,
    includeSchedule
  });
  
  // Get MLB data
  const mlbData = useMLBData({
    refreshInterval,
    includeTeams,
    includePlayerStats,
    includeStandings,
    teamId
  });
  
  // Determine which data set to use
  const data = dataSource === "ESPN" ? espnData : mlbData;
  
  // Filter MLB-only data if ESPN is selected but league is MLB
  const filteredData = (() => {
    if (dataSource === "ESPN" && league === "MLB") {
      return {
        ...data,
        allMatches: data.allMatches.filter(match => match.league === "MLB"),
        upcomingMatches: data.upcomingMatches.filter(match => match.league === "MLB"),
        liveMatches: data.liveMatches.filter(match => match.league === "MLB"),
        finishedMatches: data.finishedMatches.filter(match => match.league === "MLB")
      };
    }
    return data;
  })();
  
  // If MLB is the selected league, prioritize MLB data source
  if (league === "MLB" && dataSource !== "MLB") {
    setDataSource("MLB");
  }
  
  return {
    ...filteredData,
    dataSource,
    setDataSource
  };
}
