import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function useCLVLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query the clv_leaderboard view
      const { data, error: fetchError } = await supabase
        .from('clv_leaderboard')
        .select('*')
        .limit(50);

      if (fetchError) {
        console.log('Error fetching CLV leaderboard:', fetchError.message);
        setLeaderboard([]);
        setError('Unable to load leaderboard data');
      } else {
        // Map the view data to our interface
        const entries: LeaderboardEntry[] = (data || []).map((row: any) => ({
          user_id: row.user_id,
          display_name: row.display_name || row.full_name || 'Anonymous',
          avatar_url: row.avatar_url,
          total_bets_with_clv: row.total_bets_with_clv || 0,
          avg_clv: row.avg_clv || 0,
          median_clv: row.median_clv || 0,
          positive_clv_bets: row.positive_clv_bets || 0,
          positive_clv_rate: row.positive_clv_rate || 0,
          best_clv: row.best_clv || 0,
          worst_clv: row.worst_clv || 0,
          total_profit: row.total_profit || 0,
          roi_percentage: row.roi_percentage || 0
        }));
        setLeaderboard(entries);
      }
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setLeaderboard([]);
      setError('Network error loading leaderboard');
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
