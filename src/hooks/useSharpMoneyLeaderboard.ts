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
      throw new Error('Failed to fetch leaderboard');
    }
    
    const data = await response.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    // Return mock data for demo
    return generateMockLeaderboard();
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
      throw new Error('Failed to fetch recent predictions');
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
    return generateMockRecentPredictions();
  }
}

// Generate mock leaderboard data
function generateMockLeaderboard(): SignalStats[] {
  return [
    {
      signalType: 'reverse_line',
      totalPredictions: 248,
      wins: 142,
      losses: 98,
      pushes: 8,
      pending: 12,
      winRate: 59.2,
      avgConfidence: 72.3,
      clvRate: 64.5,
      leagueCount: 6,
    },
    {
      signalType: 'steam_move',
      totalPredictions: 312,
      wins: 171,
      losses: 131,
      pushes: 10,
      pending: 8,
      winRate: 56.6,
      avgConfidence: 68.1,
      clvRate: 71.2,
      leagueCount: 6,
    },
    {
      signalType: 'line_freeze',
      totalPredictions: 156,
      wins: 82,
      losses: 68,
      pushes: 6,
      pending: 4,
      winRate: 54.7,
      avgConfidence: 61.4,
      clvRate: 52.3,
      leagueCount: 5,
    },
    {
      signalType: 'whale_bet',
      totalPredictions: 89,
      wins: 48,
      losses: 38,
      pushes: 3,
      pending: 2,
      winRate: 55.8,
      avgConfidence: 75.2,
      clvRate: 58.9,
      leagueCount: 4,
    },
    {
      signalType: 'syndicate_play',
      totalPredictions: 67,
      wins: 41,
      losses: 24,
      pushes: 2,
      pending: 1,
      winRate: 63.1,
      avgConfidence: 81.5,
      clvRate: 69.2,
      leagueCount: 3,
    },
  ];
}

// Generate mock recent predictions
function generateMockRecentPredictions(): RecentPrediction[] {
  const signals = ['reverse_line', 'steam_move', 'line_freeze', 'whale_bet', 'syndicate_play'];
  const leagues = ['NBA', 'NFL', 'NCAAB', 'NHL', 'MLB'];
  const results = ['won', 'won', 'won', 'lost', 'lost', 'pending', 'pending'];
  
  const mockGames = [
    { home: 'Lakers', away: 'Celtics' },
    { home: 'Chiefs', away: 'Bills' },
    { home: 'Warriors', away: 'Suns' },
    { home: 'Bruins', away: 'Rangers' },
    { home: 'Yankees', away: 'Red Sox' },
    { home: 'Bucks', away: 'Heat' },
    { home: 'Eagles', away: 'Cowboys' },
    { home: 'Duke', away: 'UNC' },
  ];
  
  return mockGames.map((game, i) => ({
    id: `mock-${i}`,
    matchId: `match-${i}`,
    matchTitle: `${game.away} @ ${game.home}`,
    league: leagues[i % leagues.length],
    homeTeam: game.home,
    awayTeam: game.away,
    signalType: signals[i % signals.length],
    signalStrength: i % 3 === 0 ? 'strong' : i % 2 === 0 ? 'moderate' : 'weak',
    sharpSide: i % 2 === 0 ? 'home' : 'away',
    marketType: i % 3 === 0 ? 'spread' : i % 3 === 1 ? 'moneyline' : 'total',
    confidence: 55 + Math.floor(Math.random() * 35),
    gameResult: results[i % results.length],
    detectedAt: new Date(Date.now() - i * 3600000).toISOString(),
    actualScoreHome: results[i % results.length] !== 'pending' ? 100 + Math.floor(Math.random() * 20) : undefined,
    actualScoreAway: results[i % results.length] !== 'pending' ? 95 + Math.floor(Math.random() * 20) : undefined,
  }));
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
      throw new Error('Failed to fetch ROI data');
    }
    
    const data = await response.json();
    return data.roi || [];
  } catch (error) {
    console.error('Error fetching ROI data:', error);
    // Return mock data for demo
    return generateMockROIData();
  }
}

// Generate mock ROI data
function generateMockROIData(): SignalROI[] {
  return [
    {
      signalType: 'syndicate_play',
      totalBets: 67,
      wins: 41,
      losses: 24,
      pushes: 2,
      totalStaked: 6500,
      totalReturn: 7822.31,
      profit: 1322.31,
      roi: 20.3,
      avgOdds: -110,
      bestStreak: 7,
      worstStreak: -3,
      currentStreak: 3,
      byLeague: {
        'NBA': { wins: 18, losses: 10, profit: 627.28 },
        'NFL': { wins: 15, losses: 9, profit: 463.64 },
        'NCAAB': { wins: 8, losses: 5, profit: 231.39 },
      },
      byMarket: {
        'spread': { wins: 22, losses: 13, profit: 691.03 },
        'moneyline': { wins: 12, losses: 7, profit: 372.76 },
        'total': { wins: 7, losses: 4, profit: 258.52 },
      },
      monthlyData: {
        '2026-01': { wins: 12, losses: 6, profit: 490.92 },
        '2025-12': { wins: 15, losses: 9, profit: 463.64 },
        '2025-11': { wins: 14, losses: 9, profit: 367.75 },
      },
    },
    {
      signalType: 'reverse_line',
      totalBets: 248,
      wins: 142,
      losses: 98,
      pushes: 8,
      totalStaked: 24000,
      totalReturn: 27091.22,
      profit: 3091.22,
      roi: 12.9,
      avgOdds: -110,
      bestStreak: 9,
      worstStreak: -5,
      currentStreak: -2,
      byLeague: {
        'NBA': { wins: 52, losses: 38, profit: 1018.24 },
        'NFL': { wins: 41, losses: 28, profit: 954.59 },
        'NHL': { wins: 28, losses: 18, profit: 727.30 },
        'NCAAB': { wins: 21, losses: 14, profit: 391.09 },
      },
      byMarket: {
        'spread': { wins: 78, losses: 54, profit: 1700.08 },
        'moneyline': { wins: 38, losses: 26, profit: 854.58 },
        'total': { wins: 26, losses: 18, profit: 536.56 },
      },
      monthlyData: {
        '2026-01': { wins: 28, losses: 18, profit: 727.30 },
        '2025-12': { wins: 38, losses: 26, profit: 854.58 },
        '2025-11': { wins: 42, losses: 28, profit: 972.78 },
        '2025-10': { wins: 34, losses: 26, profit: 536.56 },
      },
    },
    {
      signalType: 'steam_move',
      totalBets: 312,
      wins: 171,
      losses: 131,
      pushes: 10,
      totalStaked: 30200,
      totalReturn: 32623.81,
      profit: 2423.81,
      roi: 8.0,
      avgOdds: -110,
      bestStreak: 6,
      worstStreak: -4,
      currentStreak: 1,
      byLeague: {
        'NBA': { wins: 62, losses: 48, profit: 868.26 },
        'NFL': { wins: 48, losses: 38, profit: 590.98 },
        'NHL': { wins: 35, losses: 26, profit: 590.97 },
        'MLB': { wins: 26, losses: 19, profit: 373.60 },
      },
      byMarket: {
        'spread': { wins: 88, losses: 68, profit: 1227.36 },
        'moneyline': { wins: 52, losses: 40, profit: 727.28 },
        'total': { wins: 31, losses: 23, profit: 469.17 },
      },
      monthlyData: {
        '2026-01': { wins: 32, losses: 24, profit: 505.52 },
        '2025-12': { wins: 45, losses: 36, profit: 536.43 },
        '2025-11': { wins: 50, losses: 38, profit: 773.02 },
        '2025-10': { wins: 44, losses: 33, profit: 608.84 },
      },
    },
    {
      signalType: 'whale_bet',
      totalBets: 89,
      wins: 48,
      losses: 38,
      pushes: 3,
      totalStaked: 8600,
      totalReturn: 9158.68,
      profit: 558.68,
      roi: 6.5,
      avgOdds: -110,
      bestStreak: 5,
      worstStreak: -4,
      currentStreak: 0,
      byLeague: {
        'NBA': { wins: 20, losses: 16, profit: 227.28 },
        'NFL': { wins: 18, losses: 14, profit: 236.36 },
        'NHL': { wins: 10, losses: 8, profit: 95.04 },
      },
      byMarket: {
        'spread': { wins: 26, losses: 21, profit: 286.42 },
        'moneyline': { wins: 14, losses: 11, profit: 172.76 },
        'total': { wins: 8, losses: 6, profit: 99.50 },
      },
      monthlyData: {
        '2026-01': { wins: 14, losses: 10, profit: 272.76 },
        '2025-12': { wins: 18, losses: 15, profit: 163.65 },
        '2025-11': { wins: 16, losses: 13, profit: 122.27 },
      },
    },
    {
      signalType: 'line_freeze',
      totalBets: 156,
      wins: 82,
      losses: 68,
      pushes: 6,
      totalStaked: 15000,
      totalReturn: 15645.62,
      profit: 645.62,
      roi: 4.3,
      avgOdds: -110,
      bestStreak: 5,
      worstStreak: -5,
      currentStreak: -1,
      byLeague: {
        'NBA': { wins: 32, losses: 26, profit: 290.96 },
        'NFL': { wins: 28, losses: 24, profit: 163.68 },
        'NHL': { wins: 22, losses: 18, profit: 190.98 },
      },
      byMarket: {
        'spread': { wins: 44, losses: 37, profit: 327.31 },
        'moneyline': { wins: 24, losses: 20, profit: 181.84 },
        'total': { wins: 14, losses: 11, profit: 136.47 },
      },
      monthlyData: {
        '2026-01': { wins: 18, losses: 14, profit: 236.36 },
        '2025-12': { wins: 24, losses: 21, profit: 136.41 },
        '2025-11': { wins: 22, losses: 18, profit: 190.98 },
        '2025-10': { wins: 18, losses: 15, profit: 81.87 },
      },
    },
  ];
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
