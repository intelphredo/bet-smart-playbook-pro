// Sharp Money Games Hook - Filters games with sharp betting action
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match, League } from '@/types/sports';
import { BettingTrend, SharpSignal } from '@/types/bettingTrends';
import { fetchBettingTrends } from '@/services/bettingTrendsService';

export interface SharpMoneyGame {
  match: Match;
  trend: BettingTrend;
  sharpScore: number; // 0-100 indicating strength of sharp action
  signalTypes: SharpSignal['type'][];
  hasReverseLineMovement: boolean;
  sharpSide: 'home' | 'away' | 'neutral';
  confidence: number;
}

interface UseSharpMoneyGamesOptions {
  matches: Match[];
  league?: League | 'ALL';
  minSharpScore?: number;
  enabled?: boolean;
}

export function useSharpMoneyGames({
  matches,
  league = 'ALL',
  minSharpScore = 0,
  enabled = true,
}: UseSharpMoneyGamesOptions) {
  // Fetch betting trends for all major leagues
  const leagues: League[] = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF'];
  const targetLeagues = league === 'ALL' ? leagues : [league as League];

  const trendsQueries = useQuery({
    queryKey: ['sharp-money-trends', targetLeagues.join(',')],
    queryFn: async () => {
      const allTrends: BettingTrend[] = [];
      for (const l of targetLeagues) {
        try {
          const trends = await fetchBettingTrends(l);
          allTrends.push(...trends);
        } catch (e) {
          console.warn(`Failed to fetch trends for ${l}:`, e);
        }
      }
      return allTrends;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000,
    enabled: enabled && matches.length > 0,
  });

  // Calculate sharp score for a trend
  const calculateSharpScore = (trend: BettingTrend): number => {
    let score = 0;
    
    // Base confidence
    score += trend.sharpBetting.confidence * 0.3;
    
    // Reverse line movement is major signal
    if (trend.lineMovement.reverseLineMovement) {
      score += 25;
    }
    
    // Count and weight signals
    for (const signal of trend.sharpBetting.signals) {
      if (signal.strength === 'strong') {
        score += 20;
      } else if (signal.strength === 'moderate') {
        score += 10;
      } else {
        score += 5;
      }
      
      // Extra weight for certain signal types
      if (signal.type === 'steam_move') score += 5;
      if (signal.type === 'reverse_line') score += 5;
    }
    
    // Line movement magnitude
    const spreadMove = Math.abs(trend.lineMovement.spreadMovement);
    if (spreadMove >= 2) score += 15;
    else if (spreadMove >= 1) score += 8;
    
    return Math.min(100, Math.round(score));
  };

  // Match trends to games
  const sharpGames = useMemo<SharpMoneyGame[]>(() => {
    if (!trendsQueries.data) return [];
    
    const games: SharpMoneyGame[] = [];
    
    for (const match of matches) {
      const homeTeamName = typeof match.homeTeam === 'string' ? match.homeTeam : match.homeTeam.name;
      const awayTeamName = typeof match.awayTeam === 'string' ? match.awayTeam : match.awayTeam.name;
      
      // Find matching trend
      const trend = trendsQueries.data.find(t => {
        // Match by ID
        if (t.matchId === match.id) return true;
        
        // Match by team names
        const homeMatch = homeTeamName.toLowerCase().includes(t.homeTeam.toLowerCase()) ||
                         t.homeTeam.toLowerCase().includes(homeTeamName.toLowerCase());
        const awayMatch = awayTeamName.toLowerCase().includes(t.awayTeam.toLowerCase()) ||
                         t.awayTeam.toLowerCase().includes(awayTeamName.toLowerCase());
        
        return homeMatch || awayMatch;
      });
      
      if (!trend) continue;
      
      const sharpScore = calculateSharpScore(trend);
      
      // Only include if meets minimum score
      if (sharpScore < minSharpScore) continue;
      
      // Only include if there's actual sharp action
      if (trend.sharpBetting.signals.length === 0 && !trend.lineMovement.reverseLineMovement) continue;
      
      games.push({
        match,
        trend,
        sharpScore,
        signalTypes: trend.sharpBetting.signals.map(s => s.type),
        hasReverseLineMovement: trend.lineMovement.reverseLineMovement,
        sharpSide: trend.sharpBetting.spreadFavorite,
        confidence: trend.sharpBetting.confidence,
      });
    }
    
    // Sort by sharp score descending
    return games.sort((a, b) => b.sharpScore - a.sharpScore);
  }, [matches, trendsQueries.data, minSharpScore]);

  // Statistics
  const stats = useMemo(() => {
    const total = sharpGames.length;
    const withRLM = sharpGames.filter(g => g.hasReverseLineMovement).length;
    const steamMoves = sharpGames.filter(g => g.signalTypes.includes('steam_move')).length;
    const strongSignals = sharpGames.filter(g => g.sharpScore >= 60).length;
    
    return {
      total,
      withRLM,
      steamMoves,
      strongSignals,
      avgConfidence: total > 0 
        ? Math.round(sharpGames.reduce((sum, g) => sum + g.confidence, 0) / total)
        : 0,
    };
  }, [sharpGames]);

  return {
    sharpGames,
    stats,
    isLoading: trendsQueries.isLoading,
    isError: trendsQueries.isError,
    refetch: trendsQueries.refetch,
  };
}
