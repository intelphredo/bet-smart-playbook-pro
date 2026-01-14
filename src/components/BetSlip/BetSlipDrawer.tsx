import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Receipt, Trash2, DollarSign, TrendingUp, AlertCircle, Layers } from 'lucide-react';
import { useBetSlip } from './BetSlipContext';
import { useAuth } from '@/hooks/useAuth';
import BetSlipItem from './BetSlipItem';
import { useNavigate } from 'react-router-dom';
import { isDevMode } from '@/utils/devMode';
import { calculateParlayOdds, calculateParlayPayout } from '@/types/betting';

export default function BetSlipDrawer() {
  const { betSlip, clearBetSlip, stats } = useBetSlip();
  const { user } = useAuth();
  const devMode = isDevMode();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isParlayMode, setIsParlayMode] = useState(false);
  const [parlayStake, setParlayStake] = useState(10);

  // Calculate straight bet payout (assume $10 default stake)
  const straightPayout = betSlip.reduce((sum, item) => {
    if (item.odds > 0) {
      return sum + 10 + (10 * (item.odds / 100));
    } else {
      return sum + 10 + (10 * (100 / Math.abs(item.odds)));
    }
  }, 0);

  // Calculate parlay odds and payout
  const parlayOdds = calculateParlayOdds(betSlip);
  const parlayPayout = calculateParlayPayout(parlayOdds, parlayStake);

  const showContent = user || devMode;
  const canParlay = betSlip.length >= 2;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Receipt className="h-4 w-4 mr-2" />
          Bet Slip
          {betSlip.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
              {betSlip.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bet Slip
            {betSlip.length > 0 && (
              <Badge variant="secondary">{betSlip.length} selections</Badge>
            )}
            {devMode && (
              <Badge variant="outline" className="ml-2 text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Dev Mode
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {!showContent && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Please login to track your bets
            </p>
            <Button onClick={() => navigate('/auth')}>Login</Button>
          </div>
        )}

        {showContent && betSlip.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Receipt className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-muted-foreground text-center">
              Your bet slip is empty.<br />
              Click on odds to add selections.
            </p>
          </div>
        )}

        {showContent && betSlip.length > 0 && (
          <>
            {/* Parlay Toggle */}
            {canParlay && (
              <div className="flex items-center justify-between py-3 px-1 border-b">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <Label htmlFor="parlay-mode" className="text-sm font-medium cursor-pointer">
                    Parlay Mode
                  </Label>
                </div>
                <Switch
                  id="parlay-mode"
                  checked={isParlayMode}
                  onCheckedChange={setIsParlayMode}
                />
              </div>
            )}

            {/* Parlay Info */}
            {isParlayMode && canParlay && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{betSlip.length}-Leg Parlay</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Combined Odds:</span>
                    <span className="ml-2 font-semibold text-primary">
                      {parlayOdds > 0 ? '+' : ''}{Math.round(parlayOdds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To Win:</span>
                    <span className="ml-2 font-semibold text-emerald-500">
                      ${(parlayPayout - parlayStake).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Label htmlFor="parlay-stake" className="text-xs text-muted-foreground">Stake:</Label>
                  <input
                    id="parlay-stake"
                    type="number"
                    min="1"
                    value={parlayStake}
                    onChange={(e) => setParlayStake(Math.max(1, Number(e.target.value)))}
                    className="w-20 h-7 text-sm border rounded px-2 bg-background"
                  />
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 py-4">
                {betSlip.map((item, index) => (
                  <BetSlipItem 
                    key={`${item.matchId}-${item.betType}-${item.selection}-${index}`} 
                    item={item}
                    showLegNumber={isParlayMode}
                    legNumber={index + 1}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {isParlayMode ? 'Parlay Payout' : 'Potential Payout'}
                </span>
                <span className="font-semibold text-lg flex items-center text-emerald-500">
                  <DollarSign className="h-4 w-4" />
                  {isParlayMode ? parlayPayout.toFixed(2) : straightPayout.toFixed(2)}
                </span>
              </div>

              {isParlayMode && (
                <p className="text-xs text-muted-foreground">
                  All {betSlip.length} legs must win to collect. Higher risk, higher reward!
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBetSlip}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigate('/bet-history');
                    setIsOpen(false);
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          </>
        )}

        {showContent && stats && (
          <div className="border-t mt-4 pt-4">
            <h4 className="text-sm font-medium mb-3">Your Stats</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold">{stats.total_bets}</p>
                <p className="text-xs text-muted-foreground">Total Bets</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className={`text-lg font-bold ${stats.roi_percentage >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {stats.roi_percentage >= 0 ? '+' : ''}{stats.roi_percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">ROI</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className={`text-lg font-bold ${stats.total_profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  ${Math.abs(stats.total_profit).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Profit</p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
