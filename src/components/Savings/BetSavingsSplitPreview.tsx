import { motion } from 'framer-motion';
import { PiggyBank, ArrowRight } from 'lucide-react';
import { BetSavingsSplit } from '@/hooks/useSavings';
import { cn } from '@/lib/utils';

interface BetSavingsSplitPreviewProps {
  split: BetSavingsSplit;
  className?: string;
  compact?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

export function BetSavingsSplitPreview({ split, className, compact = false }: BetSavingsSplitPreviewProps) {
  if (!split || split.savingsAmount <= 0) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-primary/8 border border-primary/20",
          className
        )}
      >
        <PiggyBank className="h-3 w-3 text-primary shrink-0" />
        <span className="text-muted-foreground">
          <span className="font-semibold text-primary">{formatCurrency(split.savingsAmount)}</span>
          {' '}saved • wager: <span className="font-semibold">{formatCurrency(split.actualWager)}</span>
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/6 p-3 space-y-2",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <PiggyBank className="h-3.5 w-3.5" />
        Savings split ({split.savingsRate}% rate)
      </div>
      <div className="flex items-center gap-2 text-sm">
        {/* Original */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground">You enter</div>
          <div className="font-bold">{formatCurrency(split.originalStake)}</div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {/* Savings */}
        <div className="flex-1 rounded-lg bg-primary/15 border border-primary/30 px-2 py-1.5 text-center">
          <div className="text-xs text-primary/80">🏦 Saved</div>
          <div className="font-bold text-primary">{formatCurrency(split.savingsAmount)}</div>
        </div>
        <span className="text-muted-foreground text-xs">+</span>
        {/* Wager */}
        <div className="flex-1 rounded-lg bg-muted/60 border border-border/30 px-2 py-1.5 text-center">
          <div className="text-xs text-muted-foreground">🎲 Wagered</div>
          <div className="font-bold">{formatCurrency(split.actualWager)}</div>
        </div>
      </div>
    </motion.div>
  );
}
