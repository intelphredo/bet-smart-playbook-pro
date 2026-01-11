import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { BetSlipItem as BetSlipItemType } from '@/types/betting';
import { useBetSlip } from './BetSlipContext';

interface BetSlipItemProps {
  item: BetSlipItemType;
  showLegNumber?: boolean;
  legNumber?: number;
}

export default function BetSlipItem({ item, showLegNumber, legNumber }: BetSlipItemProps) {
  const { removeFromBetSlip, placeBet } = useBetSlip();
  const [stake, setStake] = useState<string>('');
  const [isPlacing, setIsPlacing] = useState(false);

  const stakeNum = parseFloat(stake) || 0;
  const potentialPayout = stakeNum * item.odds;
  const potentialProfit = potentialPayout - stakeNum;

  const handlePlaceBet = async () => {
    if (stakeNum <= 0) return;
    setIsPlacing(true);
    await placeBet(item, stakeNum);
    setIsPlacing(false);
    setStake('');
  };

  const useKellyStake = () => {
    if (item.kellyRecommended) {
      setStake(item.kellyRecommended.toFixed(2));
    }
  };

  return (
    <Card className="p-3 relative">
      <button
        onClick={() => removeFromBetSlip(item.matchId, item.betType, item.selection)}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors"
        aria-label="Remove from bet slip"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="pr-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            {showLegNumber && legNumber && (
              <span className="text-xs font-bold text-primary mr-2">Leg {legNumber}</span>
            )}
            <p className="font-medium text-sm line-clamp-1">{item.matchTitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
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

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{item.selection}</span>
          <span className="text-lg font-bold text-primary">{item.odds.toFixed(2)}</span>
        </div>

        {/* Model insights */}
        {(item.modelConfidence || item.modelEvPercentage) && (
          <div className="flex items-center gap-2 text-xs">
            {item.modelConfidence && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {item.modelConfidence}% conf
              </span>
            )}
            {item.modelEvPercentage && item.modelEvPercentage > 0 && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                +{item.modelEvPercentage.toFixed(1)}% EV
              </Badge>
            )}
          </div>
        )}

        {/* Stake input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              placeholder="0.00"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="pl-6 h-9"
              min="0"
              step="0.01"
            />
          </div>
          {item.kellyRecommended && (
            <Button
              variant="ghost"
              size="sm"
              onClick={useKellyStake}
              className="text-xs h-9 px-2"
              title="Use Kelly recommended stake"
            >
              Kelly: ${item.kellyRecommended.toFixed(0)}
            </Button>
          )}
        </div>

        {/* Payout preview */}
        {stakeNum > 0 && (
          <div className="flex justify-between text-sm bg-muted/50 rounded-md p-2">
            <span className="text-muted-foreground">To win:</span>
            <span className="font-semibold text-green-600">+${potentialProfit.toFixed(2)}</span>
          </div>
        )}

        {/* Place bet button */}
        <Button
          onClick={handlePlaceBet}
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
            <>Place Bet{stakeNum > 0 && ` - $${stakeNum.toFixed(2)}`}</>
          )}
        </Button>

        {/* Risk warning for high stakes */}
        {item.kellyRecommended && stakeNum > item.kellyRecommended * 2 && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Stake exceeds 2x Kelly recommendation</span>
          </div>
        )}
      </div>
    </Card>
  );
}
