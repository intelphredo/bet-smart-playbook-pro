
import { useState, useEffect } from "react";
import { fetchMLBSchedule, fetchMLBTeams, fetchMLBPlayerStats, fetchMLBStandings } from "@/services/mlbApi";
import { Match, League, Team, PlayerStats } from "@/types";

interface UseMLBDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  includePlayerStats?: boolean;
  teamId?: string;
}

export function useMLBData({
  league = "MLB",
  refreshInterval = 60000,
  includeSchedule = true,
  includePlayerStats = false,
  teamId,
}: UseMLBDataOptions = {}) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [divisionsStandings, setDivisionsStandings] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [standingsError, setStandingsError] = useState<Error | null>(null);

  const fetchSchedule = async () => {
    if (!includeSchedule) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const matches = await fetchMLBSchedule();
      setAllMatches(matches);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const teams = await fetchMLBTeams();
      setTeams(teams);
    } catch (e: any) {
      console.error("Error fetching MLB teams:", e);
    }
  };

  const fetchStandings = async () => {
    setIsLoadingStandings(true);
    setStandingsError(null);
    try {
      const standings = await fetchMLBStandings();
      setDivisionsStandings(standings);
    } catch (e: any) {
      setStandingsError(e);
    } finally {
      setIsLoadingStandings(false);
    }
  };

  const fetchStats = async () => {
    if (!includePlayerStats || !teamId) return;
    
    try {
      const stats = await fetchMLBPlayerStats(teamId);
      setPlayerStats(stats);
    } catch (e: any) {
      console.error("Error fetching MLB player stats:", e);
    }
  };

  const refetch = () => {
    fetchSchedule();
  };

  const fetchLiveGameData = async (gameId: string): Promise<any> => {
    try {
      // Implementation would go here
      return {};
    } catch (e) {
      console.error("Error fetching live game data:", e);
      return null;
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchTeams();

    if (refreshInterval) {
      const intervalId = setInterval(fetchSchedule, refreshInterval);
      return () => clearInterval(intervalId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSchedule, refreshInterval]);

  useEffect(() => {
    fetchStandings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (includePlayerStats && teamId) {
      fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includePlayerStats, teamId]);

  const upcomingMatches = allMatches.filter(m => m.status === "scheduled" || m.status === "pre");
  const liveMatches = allMatches.filter(m => m.status === "live");
  const finishedMatches = allMatches.filter(m => m.status === "finished");
  
  return {
    allMatches,
    teams,
    playerStats,
    upcomingMatches,
    liveMatches,
    finishedMatches,
    isLoading,
    error,
    refetch,
    refetchSchedule: refetch,
    divisionsStandings,
    isLoadingStandings,
    standingsError,
    fetchLiveGameData
  };
}
