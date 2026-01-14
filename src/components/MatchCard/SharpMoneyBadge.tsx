// Sharp Money Badge for Match Cards
// Displays sharp betting indicators directly on match cards

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { useMatchBettingTrend } from '@/hooks/useBettingTrends';
import { League } from '@/types/sports';
import { cn } from '@/lib/utils';

interface SharpMoneyBadgeProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  compact?: boolean;
}

export function SharpMoneyBadge({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  league,
  compact = true 
}: SharpMoneyBadgeProps) {
  const { data: trend, isLoading } = useMatchBettingTrend(
    matchId,
    homeTeam,
    awayTeam,
    league as League,
    true
  );

  const sharpIndicator = useMemo(() => {
    if (!trend) return null;

    const { sharpBetting, lineMovement, publicBetting } = trend;
    
    // Check for strong sharp signals
    const strongSignals = sharpBetting.signals.filter(s => s.strength === 'strong');
    const hasReverseLineMovement = lineMovement.reverseLineMovement;
    const highSharpConfidence = sharpBetting.confidence >= 70;

    // Determine what to show
    if (strongSignals.length > 0) {
      const signal = strongSignals[0];
      return {
        type: signal.type,
        side: signal.side,
        label: signal.type === 'steam_move' ? 'Steam' : 
               signal.type === 'reverse_line' ? 'RLM' :
               signal.type === 'whale_bet' ? 'Whale' : 'Sharp',
        icon: signal.type === 'steam_move' ? Zap : 
              signal.type === 'reverse_line' ? TrendingUp : Brain,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        description: signal.description,
        confidence: sharpBetting.confidence,
      };
    }

    if (hasReverseLineMovement) {
      const spreadMoved = lineMovement.spreadMovement !== 0;
      const side = lineMovement.spreadMovement > 0 ? 'away' : 'home';
      return {
        type: 'reverse_line',
        side,
        label: 'RLM',
        icon: TrendingUp,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
        description: `Line moved ${Math.abs(lineMovement.spreadMovement).toFixed(1)} pts against public`,
        confidence: sharpBetting.confidence,
      };
    }

    if (highSharpConfidence) {
      return {
        type: 'sharp_action',
        side: sharpBetting.spreadFavorite,
        label: 'Sharp',
        icon: Brain,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
        description: `${sharpBetting.confidence}% sharp confidence on ${sharpBetting.spreadFavorite}`,
        confidence: sharpBetting.confidence,
      };
    }

    // Check for significant public/sharp split (when money differs from tickets)
    const publicOnHome = publicBetting.spreadHome;
    const moneyOnHome = trend.moneyFlow.homeMoneyPct;
    const splitDiff = Math.abs(publicOnHome - moneyOnHome);
    
    if (splitDiff >= 15) {
      const sharpSide = moneyOnHome > publicOnHome ? 'home' : 'away';
      return {
        type: 'money_split',
        side: sharpSide,
        label: 'Split',
        icon: AlertTriangle,
        color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
        description: `Money/ticket split: ${splitDiff.toFixed(0)}% difference`,
        confidence: Math.min(50 + splitDiff, 85),
      };
    }

    return null;
  }, [trend]);

  if (isLoading || !sharpIndicator) return null;

  const Icon = sharpIndicator.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "h-5 px-1.5 gap-1 text-xs font-medium cursor-help border",
                sharpIndicator.color
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{sharpIndicator.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">
                {sharpIndicator.type === 'steam_move' ? '⚡ Steam Move Detected' :
                 sharpIndicator.type === 'reverse_line' ? '📈 Reverse Line Movement' :
                 sharpIndicator.type === 'money_split' ? '⚖️ Money/Ticket Split' :
                 sharpIndicator.type === 'whale_bet' ? '🐋 Whale Bet Detected' :
                 '🧠 Sharp Action Detected'}
              </p>
              <p className="text-xs text-muted-foreground">{sharpIndicator.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">{sharpIndicator.confidence}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 italic mt-1">
                Tap the ℹ️ in the nav bar for full glossary
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-md border text-sm",
      sharpIndicator.color
    )}>
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="font-medium">{sharpIndicator.label} on {sharpIndicator.side}</span>
        <span className="text-xs opacity-80">{sharpIndicator.description}</span>
      </div>
      <Badge variant="secondary" className="ml-auto text-xs">
        {sharpIndicator.confidence}%
      </Badge>
    </div>
  );
}

export default SharpMoneyBadge;
