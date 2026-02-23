import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { useBetSlip } from '@/components/BetSlip/BetSlipContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BetStatus } from '@/types/betting';
import { isDevMode } from '@/utils/devMode';

interface ManualBetEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEAGUES = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'Other'];
const BET_TYPES = [
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'spread', label: 'Spread' },
  { value: 'total', label: 'Over/Under' },
];
const SPORTSBOOKS = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'BetRivers', 'Other'];

export default function ManualBetEntryDialog({ open, onOpenChange }: ManualBetEntryDialogProps) {
  const { user } = useAuth();
  const { refetch } = useBetSlip();
  const devMode = isDevMode();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    matchTitle: '',
    league: '',
    betType: 'moneyline',
    selection: '',
    odds: '',
    stake: '',
    sportsbook: '',
    status: 'pending' as BetStatus,
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      matchTitle: '', league: '', betType: 'moneyline', selection: '',
      odds: '', stake: '', sportsbook: '', status: 'pending', notes: '',
    });
  };

  const calculatePayout = (odds: number, stake: number): number => {
    if (odds > 0) return stake + (stake * (odds / 100));
    return stake + (stake * (100 / Math.abs(odds)));
  };

  const handleSubmit = async () => {
    if (!form.matchTitle || !form.selection || !form.odds || !form.stake) {
      toast.error('Missing fields', { description: 'Please fill in game, pick, odds, and stake.' });
      return;
    }

    const odds = parseFloat(form.odds);
    const stake = parseFloat(form.stake);
    if (isNaN(odds) || isNaN(stake) || stake <= 0) {
      toast.error('Invalid values', { description: 'Please enter valid odds and stake.' });
      return;
    }

    const potentialPayout = calculatePayout(odds, stake);
    let resultProfit: number | null = null;
    if (form.status === 'won') resultProfit = potentialPayout - stake;
    else if (form.status === 'lost') resultProfit = -stake;
    else if (form.status === 'push') resultProfit = 0;

    setIsSubmitting(true);

    try {
      if (devMode) {
        const LOCAL_BETS_KEY = 'dev_mode_bets';
        const stored = localStorage.getItem(LOCAL_BETS_KEY);
        const existing = stored ? JSON.parse(stored) : [];
        const newBet = {
          id: `dev-bet-${Date.now()}`,
          user_id: 'dev-user',
          match_id: `manual-${Date.now()}`,
          match_title: form.matchTitle,
          league: form.league || null,
          bet_type: form.betType,
          selection: form.selection,
          odds_at_placement: odds,
          stake,
          potential_payout: potentialPayout,
          sportsbook: form.sportsbook || null,
          status: form.status,
          result_profit: resultProfit,
          placed_at: new Date().toISOString(),
          settled_at: form.status !== 'pending' ? new Date().toISOString() : null,
          notes: form.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_BETS_KEY, JSON.stringify([newBet, ...existing]));
      } else {
        if (!user) { toast.error('Please log in'); setIsSubmitting(false); return; }
        const { error } = await supabase.from('user_bets').insert({
          user_id: user.id,
          match_id: `manual-${Date.now()}`,
          match_title: form.matchTitle,
          league: form.league || null,
          bet_type: form.betType,
          selection: form.selection,
          odds_at_placement: odds,
          stake,
          potential_payout: potentialPayout,
          sportsbook: form.sportsbook || null,
          status: form.status,
          result_profit: resultProfit,
          settled_at: form.status !== 'pending' ? new Date().toISOString() : null,
          notes: form.notes || null,
        });
        if (error) throw error;
      }

      toast.success('Bet added!', { description: `${form.selection} @ ${odds > 0 ? '+' : ''}${odds}` });
      resetForm();
      onOpenChange(false);
      await refetch();
    } catch (error: any) {
      toast.error('Error adding bet', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const oddsNum = parseFloat(form.odds);
  const stakeNum = parseFloat(form.stake);
  const showPreview = !isNaN(oddsNum) && !isNaN(stakeNum) && stakeNum > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Bet Manually
          </DialogTitle>
          <DialogDescription>
            Log a bet you placed outside the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Game */}
          <div className="space-y-1.5">
            <Label>Game / Event *</Label>
            <Input
              placeholder="e.g. Knicks vs Celtics"
              value={form.matchTitle}
              onChange={(e) => updateField('matchTitle', e.target.value)}
              maxLength={200}
            />
          </div>

          {/* League + Sportsbook */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>League</Label>
              <Select value={form.league} onValueChange={(v) => updateField('league', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {LEAGUES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sportsbook</Label>
              <Select value={form.sportsbook} onValueChange={(v) => updateField('sportsbook', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SPORTSBOOKS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bet Type + Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bet Type *</Label>
              <Select value={form.betType} onValueChange={(v) => updateField('betType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Your Pick *</Label>
              <Input
                placeholder="e.g. Knicks -3.5"
                value={form.selection}
                onChange={(e) => updateField('selection', e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          {/* Odds + Stake */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Odds (American) *</Label>
              <Input
                type="number"
                placeholder="e.g. -110"
                value={form.odds}
                onChange={(e) => updateField('odds', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stake ($) *</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={form.stake}
                onChange={(e) => updateField('stake', e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          {/* Outcome */}
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="won">✅ Won</SelectItem>
                <SelectItem value="lost">❌ Lost</SelectItem>
                <SelectItem value="push">➖ Push</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Why you took this bet..."
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          {/* Payout Preview */}
          {showPreview && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Payout</span>
                <span className="font-bold text-primary">
                  ${calculatePayout(oddsNum, stakeNum).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">To Win</span>
                <span className="font-semibold text-green-500">
                  ${(calculatePayout(oddsNum, stakeNum) - stakeNum).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full min-h-[44px]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Bet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
