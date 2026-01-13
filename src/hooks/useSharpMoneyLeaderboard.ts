// Sharp Money Leaderboard Hook
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SignalStats {
  signalType: string;
  totalPredictions: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winRate: number;
  avgConfidence: number;
  clvRate: number;
  leagueCount?: number;
}

export interface LeagueStats {
  league: string;
  signalType: string;
  marketType: string;
  signalStrength: string;
  totalPredictions: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winRate: number;
  avgConfidence: number;
  clvRate: number;
}

export interface RecentPrediction {
  id: string;
  matchId: string;
  matchTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  signalType: string;
  signalStrength: string;
  sharpSide: string;
  marketType: string;
  confidence: number;
  gameResult: string;
  detectedAt: string;
  actualScoreHome?: number;
  actualScoreAway?: number;
}

export interface SignalROI {
  signalType: string;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  totalStaked: number;
  totalReturn: number;
  profit: number;
  roi: number;
  avgOdds: number;
  bestStreak: number;
  worstStreak: number;
  currentStreak: number;
  byLeague: Record<string, { wins: number; losses: number; profit: number }>;
  byMarket: Record<string, { wins: number; losses: number; profit: number }>;
  monthlyData: Record<string, { wins: number; losses: number; profit: number }>;
}

// Fetch leaderboard data from edge function
async function fetchLeaderboard(): Promise<SignalStats[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sharp-money-api?action=leaderboard`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch leaderboard, returning empty array');
      return [];
    }
    
    const data = await response.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Fetch stats by league
async function fetchStatsByLeague(league: string): Promise<LeagueStats[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sharp-money-api?action=by-league&league=${league}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch league stats');
    }
    
    const data = await response.json();
    return data.stats || [];
  } catch (error) {
    console.error('Error fetching league stats:', error);
    return [];
  }
}

// Fetch recent predictions
async function fetchRecentPredictions(limit = 20): Promise<RecentPrediction[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sharp-money-api?action=recent&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch recent predictions, returning empty array');
      return [];
    }
    
    const data = await response.json();
    return (data.predictions || []).map((p: any) => ({
      id: p.id,
      matchId: p.match_id,
      matchTitle: p.match_title,
      league: p.league,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      signalType: p.signal_type,
      signalStrength: p.signal_strength,
      sharpSide: p.sharp_side,
      marketType: p.market_type,
      confidence: p.confidence,
      gameResult: p.game_result,
      detectedAt: p.detected_at,
      actualScoreHome: p.actual_score_home,
      actualScoreAway: p.actual_score_away,
    }));
  } catch (error) {
    console.error('Error fetching recent predictions:', error);
    return [];
  }
}

// Fetch ROI data
async function fetchROIData(): Promise<SignalROI[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sharp-money-api?action=roi`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch ROI data, returning empty array');
      return [];
    }
    
    const data = await response.json();
    return data.roi || [];
  } catch (error) {
    console.error('Error fetching ROI data:', error);
    return [];
  }
}

// Hooks
export function useSharpMoneyLeaderboard() {
  return useQuery({
    queryKey: ['sharp-money-leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useSharpMoneyByLeague(league: string) {
  return useQuery({
    queryKey: ['sharp-money-league', league],
    queryFn: () => fetchStatsByLeague(league),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(league),
  });
}

export function useRecentSharpPredictions(limit = 20) {
  return useQuery({
    queryKey: ['sharp-money-recent', limit],
    queryFn: () => fetchRecentPredictions(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useSharpMoneyROI() {
  return useQuery({
    queryKey: ['sharp-money-roi'],
    queryFn: fetchROIData,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
