import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, TrendingUp, Settings, ChevronDown, ChevronUp, Zap, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSavings } from '@/hooks/useSavings';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

const leagueColor: Record<string, string> = {
  NBA: 'bg-orange-500/20 text-orange-400',
  NFL: 'bg-emerald-500/20 text-emerald-400',
  MLB: 'bg-blue-500/20 text-blue-400',
  NHL: 'bg-cyan-500/20 text-cyan-400',
  SOCCER: 'bg-yellow-500/20 text-yellow-400',
};

export function SavingsWidget() {
  const { user } = useAuth();
  const { account, transactions, isLoading, isSaving, updateSavingsRate, toggleSavings } = useSavings();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingRate, setPendingRate] = useState<number | null>(null);

  if (!user) return null;

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center h-36">
          <div className="animate-pulse flex gap-3 items-center text-muted-foreground">
            <PiggyBank className="h-5 w-5" />
            <span className="text-sm">Loading savings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rate = account?.savings_rate ?? 10;
  const balance = account?.balance ?? 0;
  const totalContributed = account?.total_contributed ?? 0;
  const totalBets = account?.total_saved_from_bets ?? 0;
  const isActive = account?.is_active ?? true;
  const displayRate = pendingRate !== null ? pendingRate : rate;

  const exampleWager = 100;
  const exampleSaved = parseFloat(((exampleWager * displayRate) / 100).toFixed(2));
  const exampleBet = exampleWager - exampleSaved;

  return (
    <Card className={cn(
      "border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300",
      isActive ? "border-primary/30" : "border-border/40"
    )}>
      {/* Accent strip */}
      <div className={cn(
        "h-1 w-full transition-all duration-300",
        isActive ? "bg-gradient-to-r from-primary via-primary/60 to-transparent" : "bg-border/30"
      )} />

      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
              isActive ? "bg-primary/15" : "bg-muted"
            )}>
              <PiggyBank className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Bet Savings Vault</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isActive ? `${rate}% of every wager auto-saved` : 'Savings paused'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-2",
                isActive ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
              )}
            >
              {isActive ? 'Active' : 'Paused'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowSettings(s => !s)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-4">
        {/* Balance Display */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 p-4 rounded-xl bg-primary/8 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Vault Balance</p>
            <motion.p
              key={balance}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-primary"
            >
              {formatCurrency(balance)}
            </motion.p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span>{formatCurrency(totalContributed)} total saved</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border/30 flex flex-col justify-center items-center text-center">
            <p className="text-xs text-muted-foreground mb-1">From bets</p>
            <p className="text-xl font-bold">{totalBets}</p>
            <p className="text-xs text-muted-foreground">wagers</p>
          </div>
        </div>

        {/* How it works — quick visual */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/20">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Example: $100 wager at {displayRate}% savings rate
          </p>
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="flex-1 p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <div className="text-xs text-muted-foreground">🏦 Saved</div>
              <div className="text-primary font-bold">{formatCurrency(exampleSaved)}</div>
            </div>
            <span className="text-muted-foreground text-xs">+</span>
            <div className="flex-1 p-2 rounded-lg bg-background border border-border/40 text-center">
              <div className="text-xs text-muted-foreground">🎲 Wagered</div>
              <div className="font-bold">{formatCurrency(exampleBet)}</div>
            </div>
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Separator className="mb-4" />
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable savings on bets</Label>
                  <Switch
                    checked={isActive}
                    onCheckedChange={toggleSavings}
                  />
                </div>

                {/* Rate slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Savings Rate</Label>
                    <span className="text-sm font-bold text-primary">{displayRate}%</span>
                  </div>
                  <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={[displayRate]}
                    onValueChange={([v]) => setPendingRate(v)}
                    disabled={!isActive}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1% (Light)</span>
                    <span>25% (Balanced)</span>
                    <span>50% (Max)</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  disabled={isSaving || pendingRate === null || pendingRate === rate}
                  onClick={async () => {
                    if (pendingRate !== null) {
                      await updateSavingsRate(pendingRate);
                      setPendingRate(null);
                    }
                  }}
                >
                  {isSaving ? 'Saving...' : 'Apply Rate'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History toggle */}
        {transactions.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground"
              onClick={() => setShowHistory(s => !s)}
            >
              {showHistory ? (
                <><ChevronUp className="h-3 w-3 mr-1" />Hide history</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" />Show recent contributions ({transactions.length})</>
              )}
            </Button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <Lock className="h-3 w-3 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate max-w-[140px]">
                            {tx.match_title || 'Bet contribution'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(tx.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary">+{formatCurrency(tx.amount)}</p>
                        {tx.league && (
                          <Badge className={cn("text-[9px] h-4 px-1", leagueColor[tx.league] || 'bg-muted text-muted-foreground')}>
                            {tx.league}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </CardContent>
    </Card>
  );
}
