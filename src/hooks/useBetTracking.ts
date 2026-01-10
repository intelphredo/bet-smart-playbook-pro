import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserBet, UserBettingStats, BetSlipItem, BetStatus } from '@/types/betting';
import { useToast } from '@/hooks/use-toast';

export function useBetTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bets, setBets] = useState<UserBet[]>([]);
  const [stats, setStats] = useState<UserBettingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);

  // Fetch user's bets
  const fetchBets = useCallback(async () => {
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
      toast({
        title: 'Error loading bets',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Fetch user's betting stats
  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_betting_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStats(data as UserBettingStats | null);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchBets();
    fetchStats();
  }, [fetchBets, fetchStats]);

  // Add a bet to the slip
  const addToBetSlip = useCallback((item: BetSlipItem) => {
    setBetSlip((prev) => {
      // Check if already in slip
      const exists = prev.some(
        (b) => b.matchId === item.matchId && b.betType === item.betType && b.selection === item.selection
      );
      if (exists) {
        toast({
          title: 'Already in bet slip',
          description: 'This selection is already in your bet slip.',
        });
        return prev;
      }
      return [...prev, item];
    });
  }, [toast]);

  // Remove from bet slip
  const removeFromBetSlip = useCallback((matchId: string, betType: string, selection: string) => {
    setBetSlip((prev) => prev.filter(
      (b) => !(b.matchId === matchId && b.betType === betType && b.selection === selection)
    ));
  }, []);

  // Clear bet slip
  const clearBetSlip = useCallback(() => {
    setBetSlip([]);
  }, []);

  // Place a bet
  const placeBet = useCallback(async (item: BetSlipItem, stake: number) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to place bets.',
        variant: 'destructive',
      });
      return null;
    }

    const potentialPayout = stake * item.odds;

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

      toast({
        title: 'Bet placed!',
        description: `$${stake.toFixed(2)} on ${item.selection} at ${item.odds.toFixed(2)}`,
      });

      // Refresh bets and stats
      await fetchBets();
      await fetchStats();

      // Remove from bet slip
      removeFromBetSlip(item.matchId, item.betType, item.selection);

      return data as UserBet;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast({
        title: 'Error placing bet',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, fetchBets, fetchStats, removeFromBetSlip]);

  // Update bet status (for settling bets)
  const updateBetStatus = useCallback(async (betId: string, status: BetStatus, resultProfit?: number) => {
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

      toast({
        title: 'Bet updated',
        description: `Bet marked as ${status}`,
      });

      await fetchBets();
      await fetchStats();

      return data as UserBet;
    } catch (error: any) {
      console.error('Error updating bet:', error);
      toast({
        title: 'Error updating bet',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, fetchBets, fetchStats]);

  // Delete a bet
  const deleteBet = useCallback(async (betId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Bet deleted',
        description: 'The bet has been removed.',
      });

      await fetchBets();
      await fetchStats();

      return true;
    } catch (error: any) {
      console.error('Error deleting bet:', error);
      toast({
        title: 'Error deleting bet',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchBets, fetchStats]);

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
