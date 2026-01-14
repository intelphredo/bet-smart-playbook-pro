import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  ChevronUp, 
  ChevronDown,
  X,
  Layers,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useBetSlip } from './BetSlipContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { isDevMode } from '@/utils/devMode';
import { calculateParlayOdds, calculateParlayPayout, BetSlipItem as BetSlipItemType } from '@/types/betting';
import { cn } from '@/lib/utils';

export default function FloatingBetSlip() {
  const { betSlip, clearBetSlip, removeFromBetSlip, placeBet, stats } = useBetSlip();
  const { user } = useAuth();
  const devMode = isDevMode();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isParlayMode, setIsParlayMode] = useState(false);
  const [stakes, setStakes] = useState<Record<string, string>>({});
  const [parlayStake, setParlayStake] = useState<string>('10');
  const [placingBets, setPlacingBets] = useState<Set<string>>(new Set());

  const showContent = user || devMode;
  const canParlay = betSlip.length >= 2;
  const parlayStakeNum = parseFloat(parlayStake) || 0;

  // Calculate parlay
  const parlayOdds = calculateParlayOdds(betSlip);
  const parlayPayout = calculateParlayPayout(parlayOdds, parlayStakeNum);

  // Calculate total potential payout for straight bets (American odds)
  const calculatePayout = (odds: number, stakeAmount: number): number => {
    if (odds > 0) {
      return stakeAmount + (stakeAmount * (odds / 100));
    } else {
      return stakeAmount + (stakeAmount * (100 / Math.abs(odds)));
    }
  };

  const totalPotentialPayout = betSlip.reduce((sum, item) => {
    const key = `${item.matchId}-${item.betType}-${item.selection}`;
    const stakeNum = parseFloat(stakes[key] || '0') || 0;
    if (stakeNum <= 0) return sum;
    return sum + calculatePayout(item.odds, stakeNum);
  }, 0);

  const totalStake = betSlip.reduce((sum, item) => {
    const key = `${item.matchId}-${item.betType}-${item.selection}`;
    return sum + (parseFloat(stakes[key] || '0') || 0);
  }, 0);

  const handlePlaceBet = async (item: BetSlipItemType) => {
    const key = `${item.matchId}-${item.betType}-${item.selection}`;
    const stakeNum = parseFloat(stakes[key] || '0') || 0;
    if (stakeNum <= 0) return;

    setPlacingBets(prev => new Set(prev).add(key));
    await placeBet(item, stakeNum);
    setPlacingBets(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setStakes(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handlePlaceAllBets = async () => {
    if (isParlayMode) {
      // For parlay, we'd need to implement parlay bet placement
      // For now, show a message
      return;
    }

    for (const item of betSlip) {
      const key = `${item.matchId}-${item.betType}-${item.selection}`;
      const stakeNum = parseFloat(stakes[key] || '0') || 0;
      if (stakeNum > 0) {
        await handlePlaceBet(item);
      }
    }
  };

  const handleStakeChange = (key: string, value: string) => {
    setStakes(prev => ({ ...prev, [key]: value }));
  };

  const setQuickStake = (key: string, amount: number) => {
    setStakes(prev => ({ ...prev, [key]: amount.toString() }));
  };

  // Don't render if no bets
  if (betSlip.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
      >
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <Card className="shadow-2xl border-primary/20 overflow-hidden">
            {/* Collapsed Header - Always Visible */}
            <motion.div
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer transition-colors",
                "bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10",
                isExpanded && "border-b"
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Receipt className="h-5 w-5 text-primary" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                    {betSlip.length}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Bet Slip</h3>
                  <p className="text-xs text-muted-foreground">
                    {betSlip.length} selection{betSlip.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {totalStake > 0 && !isParlayMode && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Potential Win</p>
                    <p className="font-bold text-emerald-500 flex items-center">
                      <DollarSign className="h-4 w-4" />
                      {(totalPotentialPayout - totalStake).toFixed(2)}
                    </p>
                  </div>
                )}
                {isParlayMode && parlayStakeNum > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Parlay Payout</p>
                    <p className="font-bold text-emerald-500 flex items-center">
                      <DollarSign className="h-4 w-4" />
                      {parlayPayout.toFixed(2)}
                    </p>
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4 max-h-[60vh] overflow-hidden flex flex-col">
                    {!showContent && (
                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          Please login to place bets
                        </p>
                        <Button size="sm" onClick={() => navigate('/auth')}>
                          Login
                        </Button>
                      </div>
                    )}

                    {showContent && (
                      <>
                        {/* Parlay Toggle */}
                        {canParlay && (
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-primary" />
                              <Label htmlFor="parlay-toggle" className="text-sm font-medium cursor-pointer">
                                Parlay Mode
                              </Label>
                              {isParlayMode && (
                              <Badge variant="secondary" className="text-xs">
                                {parlayOdds > 0 ? '+' : ''}{Math.round(parlayOdds)}
                              </Badge>
                              )}
                            </div>
                            <Switch
                              id="parlay-toggle"
                              checked={isParlayMode}
                              onCheckedChange={setIsParlayMode}
                            />
                          </div>
                        )}

                        {/* Parlay Stake Input */}
                        {isParlayMode && canParlay && (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{betSlip.length}-Leg Parlay</span>
                              <span className="font-bold text-primary">
                                {parlayOdds > 0 ? '+' : ''}{Math.round(parlayOdds)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground whitespace-nowrap">Stake:</Label>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  type="number"
                                  value={parlayStake}
                                  onChange={(e) => setParlayStake(e.target.value)}
                                  className="pl-6 h-8"
                                  min="0"
                                  step="1"
                                />
                              </div>
                              <div className="flex gap-1">
                                {[10, 25, 50, 100].map(amt => (
                                  <Button
                                    key={amt}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => setParlayStake(amt.toString())}
                                  >
                                    ${amt}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            {parlayStakeNum > 0 && (
                              <div className="flex justify-between text-sm pt-1">
                                <span className="text-muted-foreground">To win:</span>
                                <span className="font-bold text-emerald-500">
                                  +${(parlayPayout - parlayStakeNum).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Selections List */}
                        <ScrollArea className="flex-1 max-h-[300px]">
                          <div className="space-y-3 pr-2">
                            {betSlip.map((item, index) => {
                              const key = `${item.matchId}-${item.betType}-${item.selection}`;
                              const stakeNum = parseFloat(stakes[key] || '0') || 0;
                              const isPlacing = placingBets.has(key);
                              
                              return (
                                <motion.div
                                  key={key}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="p-3 bg-muted/30 rounded-lg relative group"
                                >
                                  {/* Remove Button */}
                                  <button
                                    onClick={() => removeFromBetSlip(item.matchId, item.betType, item.selection)}
                                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-full transition-all"
                                  >
                                    <X className="h-4 w-4 text-destructive" />
                                  </button>

                                  {/* Leg Number for Parlay */}
                                  {isParlayMode && (
                                    <Badge variant="outline" className="absolute top-2 left-2 text-xs">
                                      Leg {index + 1}
                                    </Badge>
                                  )}

                                  <div className={cn("space-y-2", isParlayMode && "pt-6")}>
                                    {/* Match Info */}
                                    <div className="flex items-start justify-between pr-6">
                                      <div>
                                        <p className="text-sm font-medium line-clamp-1">{item.matchTitle}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {item.betType}
                                          </Badge>
                                          {item.league && (
                                            <Badge variant="secondary" className="text-xs">
                                              {item.league}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Selection & Odds */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">{item.selection}</span>
                                    <span className="text-lg font-bold text-primary font-mono">
                                      {item.odds > 0 ? '+' : ''}{Math.round(item.odds)}
                                    </span>
                                    </div>

                                    {/* Model Insights */}
                                    {(item.modelConfidence || item.modelEvPercentage) && (
                                      <div className="flex items-center gap-2">
                                        {item.modelConfidence && (
                                          <Badge variant="outline" className="text-xs">
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {Math.round(item.modelConfidence)}% conf
                                          </Badge>
                                        )}
                                        {item.modelEvPercentage && item.modelEvPercentage > 0 && (
                                          <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                            +{item.modelEvPercentage.toFixed(1)}% EV
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                    {/* Stake Input - Only show if not parlay mode */}
                                    {!isParlayMode && (
                                      <div className="space-y-2 pt-2 border-t border-border/50">
                                        <div className="flex items-center gap-2">
                                          <div className="relative flex-1">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                            <Input
                                              type="number"
                                              placeholder="Enter stake"
                                              value={stakes[key] || ''}
                                              onChange={(e) => handleStakeChange(key, e.target.value)}
                                              className="pl-6 h-9"
                                              min="0"
                                              step="0.01"
                                            />
                                          </div>
                                          <div className="flex gap-1">
                                            {[10, 25, 50].map(amt => (
                                              <Button
                                                key={amt}
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-2 text-xs"
                                                onClick={() => setQuickStake(key, amt)}
                                              >
                                                ${amt}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Kelly Suggestion */}
                                        {item.kellyRecommended && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setQuickStake(key, item.kellyRecommended!)}
                                            className="text-xs h-7 w-full"
                                          >
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Use Kelly: ${item.kellyRecommended.toFixed(0)}
                                          </Button>
                                        )}

                                        {/* Payout Preview */}
                                        {stakeNum > 0 && (
                                          <div className="flex justify-between text-sm bg-muted/50 rounded-md p-2">
                                            <span className="text-muted-foreground">To win:</span>
                                            <span className="font-semibold text-emerald-500">
                                              +${(calculatePayout(item.odds, stakeNum) - stakeNum).toFixed(2)}
                                            </span>
                                          </div>
                                        )}

                                        {/* Individual Place Bet Button */}
                                        <Button
                                          onClick={() => handlePlaceBet(item)}
                                          disabled={stakeNum <= 0 || isPlacing}
                                          className="w-full h-9"
                                          size="sm"
                                        >
                                          {isPlacing ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Placing...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle2 className="h-4 w-4 mr-2" />
                                              Place Bet{stakeNum > 0 && ` - $${stakeNum.toFixed(2)}`}
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </ScrollArea>

                        <Separator />

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearBetSlip}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                          </Button>

                          {isParlayMode && parlayStakeNum > 0 && (
                            <Button className="flex-1" size="sm">
                              <Layers className="h-4 w-4 mr-2" />
                              Place Parlay - ${parlayStakeNum}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigate('/bet-history');
                              setIsExpanded(false);
                            }}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            History
                          </Button>
                        </div>

                        {/* Stats Preview */}
                        {stats && (
                          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                            <div className="bg-muted/30 rounded-lg p-2">
                              <p className="text-lg font-bold">{stats.total_bets}</p>
                              <p className="text-[10px] text-muted-foreground">Bets</p>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-2">
                              <p className={cn(
                                "text-lg font-bold",
                                stats.roi_percentage >= 0 ? 'text-emerald-500' : 'text-destructive'
                              )}>
                                {stats.roi_percentage >= 0 ? '+' : ''}{stats.roi_percentage.toFixed(1)}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">ROI</p>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-2">
                              <p className={cn(
                                "text-lg font-bold",
                                stats.total_profit >= 0 ? 'text-emerald-500' : 'text-destructive'
                              )}>
                                ${Math.abs(stats.total_profit).toFixed(0)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Profit</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
