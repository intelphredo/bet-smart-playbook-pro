import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SavingsAccount {
  id: string;
  user_id: string;
  savings_rate: number;
  balance: number;
  total_contributed: number;
  total_saved_from_bets: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  user_id: string;
  user_bet_id?: string;
  amount: number;
  original_stake: number;
  actual_wager: number;
  savings_rate_applied: number;
  match_title?: string;
  league?: string;
  type: string;
  note?: string;
  created_at: string;
}

export interface BetSavingsSplit {
  originalStake: number;
  savingsAmount: number;
  actualWager: number;
  savingsRate: number;
}

export function useSavings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<SavingsAccount | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch or create savings account
  const fetchAccount = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('user_savings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default account
        const { data: created, error: createError } = await supabase
          .from('user_savings' as any)
          .insert({ user_id: user.id, savings_rate: 10, balance: 0, total_contributed: 0, total_saved_from_bets: 0 })
          .select()
          .single();
        if (createError) throw createError;
        setAccount(created as unknown as SavingsAccount);
      } else {
        setAccount(data as unknown as SavingsAccount);
      }
    } catch (err) {
      console.error('[useSavings] Error fetching account:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch recent transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('savings_transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setTransactions((data as unknown as SavingsTransaction[]) || []);
    } catch (err) {
      console.error('[useSavings] Error fetching transactions:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchAccount();
    fetchTransactions();
  }, [fetchAccount, fetchTransactions]);

  /**
   * Calculate bet split — call this BEFORE placing the bet to show the user the breakdown
   */
  const calculateSplit = useCallback((stake: number): BetSavingsSplit => {
    const rate = account?.savings_rate ?? 10;
    const isActive = account?.is_active ?? true;
    if (!isActive || rate === 0) {
      return { originalStake: stake, savingsAmount: 0, actualWager: stake, savingsRate: 0 };
    }
    const savingsAmount = parseFloat(((stake * rate) / 100).toFixed(2));
    const actualWager = parseFloat((stake - savingsAmount).toFixed(2));
    return { originalStake: stake, savingsAmount, actualWager, savingsRate: rate };
  }, [account]);

  /**
   * Record a savings contribution after a bet is placed.
   * Returns true on success.
   */
  const recordContribution = useCallback(async (
    split: BetSavingsSplit,
    betId?: string,
    matchTitle?: string,
    league?: string,
  ): Promise<boolean> => {
    if (!user || !account || split.savingsAmount <= 0) return false;
    try {
      // Insert the transaction
      const { error: txError } = await supabase
        .from('savings_transactions' as any)
        .insert({
          user_id: user.id,
          user_bet_id: betId || null,
          amount: split.savingsAmount,
          original_stake: split.originalStake,
          actual_wager: split.actualWager,
          savings_rate_applied: split.savingsRate,
          match_title: matchTitle || null,
          league: league || null,
          type: 'contribution',
        } as any);

      if (txError) throw txError;

      // Update the balance in the account
      const { error: accError } = await supabase
        .from('user_savings' as any)
        .update({
          balance: (account.balance || 0) + split.savingsAmount,
          total_contributed: (account.total_contributed || 0) + split.savingsAmount,
          total_saved_from_bets: (account.total_saved_from_bets || 0) + 1,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('user_id', user.id);

      if (accError) throw accError;

      // Refresh local state
      await fetchAccount();
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error('[useSavings] Error recording contribution:', err);
      return false;
    }
  }, [user, account, fetchAccount, fetchTransactions]);

  /**
   * Update the savings rate (0–100)
   */
  const updateSavingsRate = useCallback(async (rate: number) => {
    if (!user || rate < 0 || rate > 100) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_savings' as any)
        .update({ savings_rate: rate, updated_at: new Date().toISOString() } as any)
        .eq('user_id', user.id);
      if (error) throw error;
      setAccount(prev => prev ? { ...prev, savings_rate: rate } : prev);
      toast({ title: 'Savings rate updated', description: `${rate}% of each bet will go to your savings.` });
    } catch (err) {
      console.error('[useSavings] Error updating rate:', err);
      toast({ title: 'Error', description: 'Could not update savings rate.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [user, toast]);

  /**
   * Toggle savings on/off
   */
  const toggleSavings = useCallback(async () => {
    if (!user || !account) return;
    const newActive = !account.is_active;
    try {
      const { error } = await supabase
        .from('user_savings' as any)
        .update({ is_active: newActive, updated_at: new Date().toISOString() } as any)
        .eq('user_id', user.id);
      if (error) throw error;
      setAccount(prev => prev ? { ...prev, is_active: newActive } : prev);
      toast({
        title: newActive ? 'Savings enabled' : 'Savings paused',
        description: newActive
          ? `${account.savings_rate}% of each wager will be saved.`
          : 'Your savings rate is paused. Bets will use your full stake.',
      });
    } catch (err) {
      console.error('[useSavings] Error toggling savings:', err);
    }
  }, [user, account, toast]);

  return {
    account,
    transactions,
    isLoading,
    isSaving,
    calculateSplit,
    recordContribution,
    updateSavingsRate,
    toggleSavings,
    refetch: () => { fetchAccount(); fetchTransactions(); },
  };
}
