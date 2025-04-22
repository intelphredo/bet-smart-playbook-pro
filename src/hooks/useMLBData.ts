import { useState, useEffect } from "react";
import { fetchMLBSchedule, fetchMLBTeams, fetchMLBStandings, fetchMLBPlayerStats } from "@/services/mlbApi";
import { Match, Team, League, PlayerStats } from "@/types";

interface UseMLBDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  includeTeams?: boolean;
  includePlayerStats?: boolean;
}

export function useMLBData({
  league = "MLB",
  refreshInterval = 60000,
  includeSchedule = true,
  includeTeams = false,
  includePlayerStats = false,
}: UseMLBDataOptions = {}) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [standingsError, setStandingsError] = useState<Error | null>(null);
  const [divisionsStandings, setDivisionsStandings] = useState<any>(null);

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
    if (!includeTeams) return;
    setIsLoadingTeams(true);
    setError(null);
    try {
      const teamsData = await fetchMLBTeams();
      setTeams(teamsData);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchStandings = async () => {
    setIsLoadingStandings(true);
    setStandingsError(null);
    try {
      const standingsData = await fetchMLBStandings();
      setDivisionsStandings(standingsData);
    } catch (e: any) {
      setStandingsError(e);
    } finally {
      setIsLoadingStandings(false);
    }
  };

  const fetchPlayerStatistics = async () => {
    if (!includePlayerStats) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch player stats for all teams (inefficient, but works for demo)
      const allTeams = await fetchMLBTeams();
      const allStats = await Promise.all(
        allTeams.map(team => fetchMLBPlayerStats(team.id))
      );
      // Flatten the array of arrays into a single array
      setPlayerStats(allStats.flat());
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    if (includeTeams) {
      fetchTeams();
    }
    if (includePlayerStats) {
      fetchPlayerStatistics();
    }
    fetchStandings(); // Always fetch standings

    if (refreshInterval) {
      const id = setInterval(fetchSchedule, refreshInterval);
      return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, includeSchedule, refreshInterval, includeTeams, includePlayerStats]);

  return {
    allMatches,
    teams,
    playerStats,
    upcomingMatches: allMatches.filter(m => m.status === "scheduled"),
    liveMatches: allMatches.filter(m => m.status === "live"),
    finishedMatches: allMatches.filter(m => m.status === "finished"),
    isLoading,
    error,
    isLoadingTeams,
    isLoadingStandings,
    standingsError,
    divisionsStandings,
    fetchLiveGameData: undefined,
  };
}
