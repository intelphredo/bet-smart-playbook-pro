// Betting Trends Hook - Fetches public/sharp betting data

import { useQuery } from '@tanstack/react-query';
import { BettingTrend, TeamBettingHistory } from '@/types/bettingTrends';
import { League } from '@/types/sports';
import { 
  fetchBettingTrends, 
  fetchMatchBettingTrend, 
  fetchTeamBettingHistory 
} from '@/services/bettingTrendsService';

// Hook to fetch all betting trends for a league
export function useBettingTrends(league: League) {
  return useQuery<BettingTrend[]>({
    queryKey: ['betting-trends', league],
    queryFn: () => fetchBettingTrends(league),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000,
    retry: 2,
  });
}

// Hook to fetch betting trend for a specific match
export function useMatchBettingTrend(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  league: League,
  enabled: boolean = true
) {
  return useQuery<BettingTrend | null>({
    queryKey: ['match-betting-trend', matchId, league],
    queryFn: () => fetchMatchBettingTrend(matchId, homeTeam, awayTeam, league),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    enabled: enabled && Boolean(matchId && league),
    retry: 2,
  });
}

// Hook to fetch team's historical betting performance
export function useTeamBettingHistory(teamName: string, league: League) {
  return useQuery<TeamBettingHistory>({
    queryKey: ['team-betting-history', teamName, league],
    queryFn: () => fetchTeamBettingHistory(teamName, league),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(teamName && league),
    retry: 1,
  });
}
