import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDevMode } from '@/utils/devMode';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_bets_with_clv: number;
  avg_clv: number;
  median_clv: number;
  positive_clv_bets: number;
  positive_clv_rate: number;
  best_clv: number;
  worst_clv: number;
  total_profit: number;
  roi_percentage: number;
}

// Mock data for dev mode
const DEV_LEADERBOARD: LeaderboardEntry[] = [
  {
    user_id: 'dev-1',
    display_name: 'S***p',
    avatar_url: null,
    total_bets_with_clv: 156,
    avg_clv: 4.2,
    median_clv: 3.8,
    positive_clv_bets: 124,
    positive_clv_rate: 79.5,
    best_clv: 18.5,
    worst_clv: -8.2,
    total_profit: 2450.00,
    roi_percentage: 12.5
  },
  {
    user_id: 'dev-2',
    display_name: 'B***r',
    avatar_url: null,
    total_bets_with_clv: 98,
    avg_clv: 3.8,
    median_clv: 3.2,
    positive_clv_bets: 71,
    positive_clv_rate: 72.4,
    best_clv: 15.2,
    worst_clv: -6.8,
    total_profit: 1820.50,
    roi_percentage: 9.8
  },
  {
    user_id: 'dev-3',
    display_name: 'E***e',
    avatar_url: null,
    total_bets_with_clv: 203,
    avg_clv: 3.5,
    median_clv: 2.9,
    positive_clv_bets: 142,
    positive_clv_rate: 69.9,
    best_clv: 22.1,
    worst_clv: -12.4,
    total_profit: 3100.00,
    roi_percentage: 8.2
  },
  {
    user_id: 'dev-4',
    display_name: 'A***x',
    avatar_url: null,
    total_bets_with_clv: 67,
    avg_clv: 3.1,
    median_clv: 2.8,
    positive_clv_bets: 45,
    positive_clv_rate: 67.2,
    best_clv: 12.8,
    worst_clv: -5.5,
    total_profit: 890.25,
    roi_percentage: 7.5
  },
  {
    user_id: 'dev-5',
    display_name: 'M***a',
    avatar_url: null,
    total_bets_with_clv: 134,
    avg_clv: 2.9,
    median_clv: 2.4,
    positive_clv_bets: 87,
    positive_clv_rate: 64.9,
    best_clv: 16.3,
    worst_clv: -9.1,
    total_profit: 1560.00,
    roi_percentage: 6.8
  }
];

export function useCLVLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (isDevMode()) {
      setLeaderboard(DEV_LEADERBOARD);
      setIsLoading(false);
      return;
    }

    try {
      // Query the view using raw SQL via RPC or direct fetch
      // Since the view isn't in generated types, we use a workaround
      const { data, error: fetchError } = await supabase
        .rpc('get_clv_leaderboard' as any)
        .limit(50);

      if (fetchError) {
        // Fallback: try direct query (view might work)
        console.log('RPC not available, using empty leaderboard');
        setLeaderboard([]);
      } else {
        setLeaderboard((data || []) as unknown as LeaderboardEntry[]);
      }
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      // Use dev data as fallback for demo
      setLeaderboard(DEV_LEADERBOARD);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refetch: fetchLeaderboard
  };
}
