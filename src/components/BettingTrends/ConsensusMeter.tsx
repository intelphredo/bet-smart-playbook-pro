import { cn } from '@/lib/utils';
import { Brain, Zap, TrendingUp } from 'lucide-react';
import { BettingTrend } from '@/types/bettingTrends';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConsensusMeterProps {
  trends: BettingTrend[];
}

function getMeterLevel(trend: BettingTrend): { score: number; label: string; color: string } {
  let score = 0;
  
  if (trend.lineMovement.reverseLineMovement) score += 35;
  
  for (const signal of trend.sharpBetting.signals) {
    if (signal.strength === 'strong') score += 20;
    else if (signal.strength === 'moderate') score += 12;
    else score += 5;
  }
  
  const spreadMove = Math.abs(trend.lineMovement.spreadMovement);
  if (spreadMove >= 2) score += 15;
  else if (spreadMove >= 1) score += 8;
  
  const splitDiff = Math.abs(trend.publicBetting.spreadHome - trend.moneyFlow.homeMoneyPct);
  if (splitDiff >= 15) score += 15;
  
  score = Math.min(100, score);
  
  if (score >= 70) return { score, label: 'Strong', color: 'bg-emerald-500' };
  if (score >= 45) return { score, label: 'Moderate', color: 'bg-amber-500' };
  if (score >= 20) return { score, label: 'Weak', color: 'bg-blue-500' };
  return { score, label: 'None', color: 'bg-muted-foreground/30' };
}

export function ConsensusMeter({ trends }: ConsensusMeterProps) {
  const withSignals = trends.filter(t => t.sharpBetting.signals.length > 0 || t.lineMovement.reverseLineMovement);
  const scored = withSignals.map(t => ({ trend: t, ...getMeterLevel(t) })).sort((a, b) => b.score - a.score);
  
  if (scored.length === 0) return null;
  
  const strong = scored.filter(s => s.label === 'Strong');
  const moderate = scored.filter(s => s.label === 'Moderate');
  
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-purple-500/10">
          <Zap className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Sharp Signal Consensus</h3>
          <p className="text-xs text-muted-foreground">
            {strong.length} strong · {moderate.length} moderate signals across {withSignals.length} games
          </p>
        </div>
      </div>
      
      <div className="flex gap-1">
        {scored.slice(0, 20).map(({ trend, score, color, label }) => {
          const sharpSide = trend.sharpBetting.spreadFavorite;
          const teamName = sharpSide === 'home' ? trend.homeTeam.split(' ').pop() : 
                           sharpSide === 'away' ? trend.awayTeam.split(' ').pop() : '—';
          return (
            <TooltipProvider key={trend.matchId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 flex flex-col items-center gap-1 cursor-default">
                    <div
                      className={cn('w-full rounded-sm transition-all', color)}
                      style={{ height: `${Math.max(8, score * 0.6)}px` }}
                    />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {trend.awayTeam.split(' ').pop()?.slice(0, 3)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{trend.awayTeam} @ {trend.homeTeam}</p>
                  <p>Signal: {label} ({score}%) · Sharp on {teamName}</p>
                  <p className="text-muted-foreground">{trend.sharpBetting.signals.length} signals detected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

export { getMeterLevel };
