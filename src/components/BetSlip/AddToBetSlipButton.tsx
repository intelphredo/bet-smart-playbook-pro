import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { useBetSlip } from './BetSlipContext';
import { BetSlipItem, BetType } from '@/types/betting';
import { cn } from '@/lib/utils';

interface AddToBetSlipButtonProps {
  matchId: string;
  matchTitle: string;
  league?: string;
  betType: BetType;
  selection: string;
  odds: number;
  sportsbook?: string;
  modelConfidence?: number;
  modelEvPercentage?: number;
  kellyRecommended?: number;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function AddToBetSlipButton({
  matchId,
  matchTitle,
  league,
  betType,
  selection,
  odds,
  sportsbook,
  modelConfidence,
  modelEvPercentage,
  kellyRecommended,
  className,
  variant = 'default',
}: AddToBetSlipButtonProps) {
  const { betSlip, addToBetSlip } = useBetSlip();

  const isInSlip = betSlip.some(
    (b) => b.matchId === matchId && b.betType === betType && b.selection === selection
  );

  const handleClick = () => {
    if (isInSlip) return;

    const item: BetSlipItem = {
      matchId,
      matchTitle,
      league,
      betType,
      selection,
      odds,
      sportsbook,
      modelConfidence,
      modelEvPercentage,
      kellyRecommended,
    };

    addToBetSlip(item);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={isInSlip}
        className={cn(
          'flex items-center justify-center gap-1 px-2 py-1 rounded text-sm font-medium transition-all',
          isInSlip
            ? 'bg-primary/20 text-primary cursor-default'
            : 'bg-muted hover:bg-primary hover:text-primary-foreground cursor-pointer',
          className
        )}
        title={isInSlip ? 'In bet slip' : 'Add to bet slip'}
      >
        {isInSlip ? (
          <Check className="h-3 w-3" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
        <span>{odds.toFixed(2)}</span>
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isInSlip}
      variant={isInSlip ? 'secondary' : 'outline'}
      size="sm"
      className={cn(
        'transition-all',
        isInSlip && 'bg-primary/10 border-primary/30',
        className
      )}
    >
      {isInSlip ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          In Slip
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-1" />
          {odds.toFixed(2)}
        </>
      )}
    </Button>
  );
}
