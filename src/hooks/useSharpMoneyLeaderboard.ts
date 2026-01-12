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
