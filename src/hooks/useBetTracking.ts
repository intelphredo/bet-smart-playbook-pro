import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserBet, UserBettingStats, BetSlipItem, BetStatus } from '@/types/betting';
import { toast } from 'sonner';
import { isDevMode } from '@/utils/devMode';
import { 
  StakeSchema, 
  BetSlipItemSchema,
} from '@/lib/validation';

const LOCAL_BETS_KEY = 'dev_mode_bets';
const LOCAL_STATS_KEY = 'dev_mode_betting_stats';

const DEFAULT_DEV_STATS: UserBettingStats = {
  id: 'dev-stats',
  user_id: 'dev-user',
  total_bets: 12,
  wins: 7,
  losses: 4,
  pushes: 1,
  pending_bets: 3,
  total_staked: 600,
  total_profit: 145.50,
  roi_percentage: 24.25,
  avg_odds: 1.95,
  avg_clv: 2.3,
  current_streak: 2,
  best_streak: 5,
  last_updated: new Date().toISOString(),
};

export function useBetTracking() {
  const { user } = useAuth();
  const devMode = isDevMode();
  const [bets, setBets] = useState<UserBet[]>([]);
  const [stats, setStats] = useState<UserBettingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);

  const fetchBets = useCallback(async () => {
    if (devMode) {
      const stored = localStorage.getItem(LOCAL_BETS_KEY);
      setBets(stored ? JSON.parse(stored) : []);
      const storedStats = localStorage.getItem(LOCAL_STATS_KEY);
      setStats(storedStats ? JSON.parse(storedStats) : DEFAULT_DEV_STATS);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setBets([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });

      if (error) throw error;
      setBets(data as UserBet[] || []);
    } catch (error: any) {
      console.error('Error fetching bets:', error);
      toast.error('Error loading bets', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, devMode]);

  const fetchStats = useCallback(async () => {
    if (devMode) return;

    if (!user) {
      setStats(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_betting_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setStats(data as UserBettingStats | null);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }, [user, devMode]);

  useEffect(() => {
    fetchBets();
    fetchStats();
  }, [fetchBets, fetchStats]);

  const addToBetSlip = useCallback((item: BetSlipItem) => {
    setBetSlip((prev) => {
      const exists = prev.some(
        (b) => b.matchId === item.matchId && b.betType === item.betType && b.selection === item.selection
      );
      if (exists) {
        toast('Already in bet slip', { description: 'This selection is already in your bet slip.' });
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromBetSlip = useCallback((matchId: string, betType: string, selection: string) => {
    setBetSlip((prev) => prev.filter(
      (b) => !(b.matchId === matchId && b.betType === betType && b.selection === selection)
    ));
  }, []);

  const clearBetSlip = useCallback(() => {
    setBetSlip([]);
  }, []);

  const placeBet = useCallback(async (item: BetSlipItem, stake: number) => {
    const stakeResult = StakeSchema.safeParse(stake);
    if (!stakeResult.success) {
      const errors = stakeResult.error.errors.map(e => e.message).join(', ');
      toast.error('Invalid stake', { description: errors });
      return null;
    }

    const itemResult = BetSlipItemSchema.safeParse(item);
    if (!itemResult.success) {
      toast.error('Invalid bet data', { description: 'Please check your selection and try again.' });
      console.error('Bet validation failed:', itemResult.error.errors);
      return null;
    }

    const potentialPayout = stake * item.odds;

    if (devMode) {
      const newBet: UserBet = {
        id: `dev-bet-${Date.now()}`,
        user_id: 'dev-user',
        match_id: item.matchId,
        match_title: item.matchTitle,
        league: item.league,
        bet_type: item.betType,
        selection: item.selection,
        odds_at_placement: item.odds,
        stake,
        potential_payout: potentialPayout,
        sportsbook: item.sportsbook,
        model_confidence: item.modelConfidence,
        model_ev_percentage: item.modelEvPercentage,
        kelly_stake_recommended: item.kellyRecommended,
        status: 'pending',
        placed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedBets = [newBet, ...bets];
      setBets(updatedBets);
      localStorage.setItem(LOCAL_BETS_KEY, JSON.stringify(updatedBets));

      toast.success('Bet placed! (Dev Mode)', {
        description: `$${stake.toFixed(2)} on ${item.selection} at ${item.odds > 0 ? '+' : ''}${Math.round(item.odds)}`,
      });

      removeFromBetSlip(item.matchId, item.betType, item.selection);
      return newBet;
    }

    if (!user) {
      toast.error('Login required', { description: 'Please login to place bets.' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_bets')
        .insert({
          user_id: user.id,
          match_id: item.matchId,
          match_title: item.matchTitle,
          league: item.league,
          bet_type: item.betType,
          selection: item.selection,
          odds_at_placement: item.odds,
          stake,
          potential_payout: potentialPayout,
          sportsbook: item.sportsbook,
          model_confidence: item.modelConfidence,
          model_ev_percentage: item.modelEvPercentage,
          kelly_stake_recommended: item.kellyRecommended,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Bet placed!', {
        description: `$${stake.toFixed(2)} on ${item.selection} at ${item.odds > 0 ? '+' : ''}${Math.round(item.odds)}`,
      });

      await fetchBets();
      await fetchStats();
      removeFromBetSlip(item.matchId, item.betType, item.selection);

      return data as UserBet;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast.error('Error placing bet', { description: error.message });
      return null;
    }
  }, [user, fetchBets, fetchStats, removeFromBetSlip, devMode, bets]);

  const updateBetStatus = useCallback(async (betId: string, status: BetStatus, resultProfit?: number) => {
    if (devMode) {
      const updatedBets = bets.map(bet => 
        bet.id === betId 
          ? { ...bet, status, result_profit: resultProfit, settled_at: new Date().toISOString() }
          : bet
      );
      setBets(updatedBets);
      localStorage.setItem(LOCAL_BETS_KEY, JSON.stringify(updatedBets));
      toast.success('Bet updated (Dev Mode)', { description: `Bet marked as ${status}` });
      return updatedBets.find(b => b.id === betId) || null;
    }

    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_bets')
        .update({
          status,
          result_profit: resultProfit,
          settled_at: status !== 'pending' ? new Date().toISOString() : null,
        })
        .eq('id', betId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Bet updated', { description: `Bet marked as ${status}` });

      await fetchBets();
      await fetchStats();

      return data as UserBet;
    } catch (error: any) {
      console.error('Error updating bet:', error);
      toast.error('Error updating bet', { description: error.message });
      return null;
    }
  }, [user, fetchBets, fetchStats, devMode, bets]);

  const deleteBet = useCallback(async (betId: string) => {
    if (devMode) {
      const updatedBets = bets.filter(bet => bet.id !== betId);
      setBets(updatedBets);
      localStorage.setItem(LOCAL_BETS_KEY, JSON.stringify(updatedBets));
      toast.success('Bet deleted (Dev Mode)', { description: 'The bet has been removed.' });
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Bet deleted', { description: 'The bet has been removed.' });

      await fetchBets();
      await fetchStats();

      return true;
    } catch (error: any) {
      console.error('Error deleting bet:', error);
      toast.error('Error deleting bet', { description: error.message });
      return false;
    }
  }, [user, fetchBets, fetchStats, devMode, bets]);

  return {
    bets,
    stats,
    isLoading,
    betSlip,
    addToBetSlip,
    removeFromBetSlip,
    clearBetSlip,
    placeBet,
    updateBetStatus,
    deleteBet,
    refetch: fetchBets,
  };
}
