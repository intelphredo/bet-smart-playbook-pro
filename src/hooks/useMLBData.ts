
import { useQuery } from "@tanstack/react-query";
import { fetchMLBSchedule, fetchMLBTeams, fetchMLBPlayerStats, fetchMLBStandings, fetchMLBLiveData } from "@/services/mlbApi";
import { Match, Team, PlayerStats, DivisionStanding } from "@/types/sports";
import { useMemo } from "react";

interface UseMLBDataOptions {
  refreshInterval?: number;
  includeTeams?: boolean;
  includePlayerStats?: boolean;
  includeStandings?: boolean;
  teamId?: string;
}

export function useMLBData({
  refreshInterval = 60000,
  includeTeams = false,
  includePlayerStats = false,
  includeStandings = false,
  teamId,
}: UseMLBDataOptions = {}) {
  // Fetch MLB schedule data
  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    error: scheduleError,
    refetch: refetchSchedule
  } = useQuery({
    queryKey: ['mlb-schedule'],
    queryFn: fetchMLBSchedule,
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
  });

  // Fetch MLB teams data if requested
  const {
    data: teamsData,
    isLoading: isLoadingTeams,
    error: teamsError
  } = useQuery({
    queryKey: ['mlb-teams'],
    queryFn: fetchMLBTeams,
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
    enabled: includeTeams,
  });

  // Fetch MLB player stats if requested and team ID is provided
  const {
    data: playerStatsData,
    isLoading: isLoadingPlayerStats,
    error: playerStatsError
  } = useQuery({
    queryKey: ['mlb-player-stats', teamId],
    queryFn: () => teamId ? fetchMLBPlayerStats(teamId) : Promise.resolve([]),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
    enabled: includePlayerStats && !!teamId,
  });

  // Fetch MLB standings if requested
  const {
    data: standingsData,
    isLoading: isLoadingStandings,
    error: standingsError
  } = useQuery({
    queryKey: ['mlb-standings'],
    queryFn: fetchMLBStandings,
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
    enabled: includeStandings,
  });

  // Process the schedule data
  const { upcomingMatches, liveMatches, finishedMatches } = useMemo(() => {
    const matches = scheduleData || [];
    const live = matches.filter(match => match.status === "live") || [];
    const upcoming = matches.filter(match => match.status === "scheduled") || [];
    const finished = matches.filter(match => match.status === "finished") || [];
    return { upcomingMatches: upcoming, liveMatches: live, finishedMatches: finished };
  }, [scheduleData]);

  // Process standings data if available
  const divisionsStandings = useMemo(() => {
    if (!standingsData) return [];
    
    const standings: DivisionStanding[] = [];
    
    standingsData.records.forEach(record => {
      const divisionStanding: DivisionStanding = {
        divisionName: record.division.name,
        teams: record.teamRecords.map(teamRecord => ({
          team: {
            id: teamRecord.team.id.toString(),
            name: teamRecord.team.name,
            shortName: teamRecord.team.abbreviation || teamRecord.team.name.substring(0, 3),
            logo: `https://www.mlbstatic.com/team-logos/${teamRecord.team.id}.svg`,
          },
          wins: teamRecord.wins,
          losses: teamRecord.losses,
          winPercentage: teamRecord.winningPercentage,
          gamesBack: teamRecord.divisionGamesBack,
          streak: teamRecord.streak.streakCode,
        }))
      };
      
      standings.push(divisionStanding);
    });
    
    return standings;
  }, [standingsData]);

  return {
    // Schedule data
    upcomingMatches,
    liveMatches,
    finishedMatches,
    allMatches: scheduleData || [],
    isLoadingSchedule,
    scheduleError,
    refetchSchedule,
    
    // Teams data
    teams: teamsData || [],
    isLoadingTeams,
    teamsError,
    
    // Player stats data
    playerStats: playerStatsData || [],
    isLoadingPlayerStats,
    playerStatsError,
    
    // Standings data
    divisionsStandings,
    isLoadingStandings,
    standingsError,
    
    // Utility to fetch live game data
    fetchLiveGameData: fetchMLBLiveData
  };
}
