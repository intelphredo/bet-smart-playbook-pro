import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Brain, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BettingTrend, SharpSignal } from '@/types/bettingTrends';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BettingTrendsCardProps {
  trend: BettingTrend;
  isLoading?: boolean;
  compact?: boolean;
}

// Signal type styling
const SIGNAL_CONFIG: Record<SharpSignal['type'], { label: string; icon: React.ReactNode; color: string }> = {
  'steam_move': { 
    label: 'Steam Move', 
    icon: <Zap className="h-3 w-3" />, 
    color: 'text-orange-500 bg-orange-500/10' 
  },
  'reverse_line': { 
    label: 'Reverse Line', 
    icon: <TrendingDown className="h-3 w-3" />, 
    color: 'text-purple-500 bg-purple-500/10' 
  },
  'line_freeze': { 
    label: 'Line Freeze', 
    icon: <Activity className="h-3 w-3" />, 
    color: 'text-blue-500 bg-blue-500/10' 
  },
  'whale_bet': { 
    label: 'Whale Bet', 
    icon: <DollarSign className="h-3 w-3" />, 
    color: 'text-green-500 bg-green-500/10' 
  },
  'syndicate_play': { 
    label: 'Syndicate', 
    icon: <Users className="h-3 w-3" />, 
    color: 'text-red-500 bg-red-500/10' 
  },
};

function PercentageBar({ 
  label1, 
  label2, 
  value1, 
  value2, 
  color1 = 'bg-primary', 
  color2 = 'bg-muted-foreground' 
}: { 
  label1: string; 
  label2: string; 
  value1: number; 
  value2: number;
  color1?: string;
  color2?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label1} <span className="text-primary">{value1.toFixed(0)}%</span></span>
        <span className="font-medium"><span className="text-muted-foreground">{value2.toFixed(0)}%</span> {label2}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div 
          className={cn("h-full transition-all", color1)} 
          style={{ width: `${value1}%` }} 
        />
        <div 
          className={cn("h-full transition-all", color2)} 
          style={{ width: `${value2}%` }} 
        />
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: SharpSignal }) {
  const config = SIGNAL_CONFIG[signal.type];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              'gap-1 text-xs cursor-help',
              config.color,
              signal.strength === 'strong' && 'border-2'
            )}
          >
            {config.icon}
            {config.label}
            {signal.strength === 'strong' && <Zap className="h-2.5 w-2.5" />}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{signal.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Strength: {signal.strength} • Side: {signal.side}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SharpIndicator({ trend }: { trend: BettingTrend }) {
  const sharpBetting = trend?.sharpBetting;
  const signals = Array.isArray(sharpBetting?.signals) ? sharpBetting.signals : [];
  const hasSignals = signals.length > 0;
  const strongSignals = signals.filter(s => s?.strength === 'strong').length;
  
  return (
    <div className="space-y-3">
      {/* Sharp confidence meter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Sharp Confidence</span>
        </div>
        <Badge variant={sharpBetting.confidence >= 70 ? 'default' : 'secondary'}>
          {sharpBetting.confidence}%
        </Badge>
      </div>
      
      <Progress value={sharpBetting.confidence} className="h-2" />
      
      {/* Sharp signals */}
      {hasSignals && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Detected Signals:</p>
          <div className="flex flex-wrap gap-1.5">
            {signals.map((signal, i) => (
              <SignalBadge key={i} signal={signal} />
            ))}
          </div>
        </div>
      )}
      
      {/* Sharp picks summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={cn(
          'p-2 rounded-lg border',
          sharpBetting.spreadFavorite !== 'neutral' && 'bg-purple-500/10 border-purple-500/30'
        )}>
          <p className="text-xs text-muted-foreground">Spread</p>
          <p className="font-semibold text-sm capitalize">
            {sharpBetting.spreadFavorite === 'neutral' ? '-' : sharpBetting.spreadFavorite}
          </p>
        </div>
        <div className={cn(
          'p-2 rounded-lg border',
          sharpBetting.moneylineFavorite !== 'neutral' && 'bg-purple-500/10 border-purple-500/30'
        )}>
          <p className="text-xs text-muted-foreground">ML</p>
          <p className="font-semibold text-sm capitalize">
            {sharpBetting.moneylineFavorite === 'neutral' ? '-' : sharpBetting.moneylineFavorite}
          </p>
        </div>
        <div className={cn(
          'p-2 rounded-lg border',
          sharpBetting.totalFavorite !== 'neutral' && 'bg-purple-500/10 border-purple-500/30'
        )}>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-semibold text-sm capitalize">
            {sharpBetting.totalFavorite === 'neutral' ? '-' : sharpBetting.totalFavorite}
          </p>
        </div>
      </div>
    </div>
  );
}

function LineMovementDisplay({ trend }: { trend: BettingTrend }) {
  const { lineMovement } = trend;
  
  return (
    <div className="space-y-3">
      {/* Spread movement */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="text-xs text-muted-foreground">Spread Movement</p>
          <p className="font-mono text-lg">
            {lineMovement.openSpread > 0 ? '+' : ''}{lineMovement.openSpread.toFixed(1)}
            <span className="text-muted-foreground mx-2">→</span>
            {lineMovement.currentSpread > 0 ? '+' : ''}{lineMovement.currentSpread.toFixed(1)}
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
          lineMovement.spreadMovement > 0 
            ? 'bg-green-500/10 text-green-600' 
            : lineMovement.spreadMovement < 0 
              ? 'bg-red-500/10 text-red-600'
              : 'bg-muted text-muted-foreground'
        )}>
          {lineMovement.spreadMovement > 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : lineMovement.spreadMovement < 0 ? (
            <ArrowDownRight className="h-4 w-4" />
          ) : null}
          {lineMovement.spreadMovement > 0 ? '+' : ''}{lineMovement.spreadMovement.toFixed(1)}
        </div>
      </div>
      
      {/* Total movement */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="text-xs text-muted-foreground">Total Movement</p>
          <p className="font-mono text-lg">
            {lineMovement.openTotal.toFixed(1)}
            <span className="text-muted-foreground mx-2">→</span>
            {lineMovement.currentTotal.toFixed(1)}
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
          lineMovement.totalMovement > 0 
            ? 'bg-green-500/10 text-green-600' 
            : lineMovement.totalMovement < 0 
              ? 'bg-red-500/10 text-red-600'
              : 'bg-muted text-muted-foreground'
        )}>
          {lineMovement.totalMovement > 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : lineMovement.totalMovement < 0 ? (
            <ArrowDownRight className="h-4 w-4" />
          ) : null}
          {lineMovement.totalMovement > 0 ? '+' : ''}{lineMovement.totalMovement.toFixed(1)}
        </div>
      </div>
      
      {/* RLM Alert */}
      {lineMovement.reverseLineMovement && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <AlertTriangle className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Reverse Line Movement Detected
            </p>
            <p className="text-xs text-muted-foreground">
              Line moving against public betting - sharp money indicator
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function BettingTrendsCard({ trend, isLoading, compact }: BettingTrendsCardProps) {
  const signals = trend?.sharpBetting?.signals;
  const hasSharpSignals = Array.isArray(signals) && signals.length > 0;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!trend) return null;
  
  if (compact) {
    return (
      <Card className={cn(hasSharpSignals && 'border-purple-500/30')}>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Public</span>
            </div>
            <span className="text-sm">
              {trend.publicBetting.spreadHome.toFixed(0)}% / {trend.publicBetting.spreadAway.toFixed(0)}%
            </span>
          </div>
          
          <PercentageBar
            label1={trend.homeTeam.split(' ').pop() || 'Home'}
            label2={trend.awayTeam.split(' ').pop() || 'Away'}
            value1={trend.publicBetting.spreadHome}
            value2={trend.publicBetting.spreadAway}
            color1="bg-blue-500"
            color2="bg-slate-400"
          />
          
          {hasSharpSignals && (
            <div className="flex flex-wrap gap-1">
              {trend.sharpBetting.signals.slice(0, 2).map((signal, i) => (
                <SignalBadge key={i} signal={signal} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn(hasSharpSignals && 'border-purple-500/30')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Betting Trends
            </CardTitle>
            <CardDescription>
              {trend.homeTeam} vs {trend.awayTeam}
            </CardDescription>
          </div>
          {hasSharpSignals && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
              <Brain className="h-3 w-3 mr-1" />
              Sharp Action
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="public" className="gap-1">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Public</span>
            </TabsTrigger>
            <TabsTrigger value="sharp" className="gap-1">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sharp</span>
            </TabsTrigger>
            <TabsTrigger value="lines" className="gap-1">
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lines</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="public" className="space-y-4 mt-0">
            <PercentageBar
              label1={trend.homeTeam.split(' ').pop() || 'Home'}
              label2={trend.awayTeam.split(' ').pop() || 'Away'}
              value1={trend.publicBetting.spreadHome}
              value2={trend.publicBetting.spreadAway}
              color1="bg-blue-500"
              color2="bg-slate-400"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Moneyline
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>% of bets on each team to win</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </p>
                <PercentageBar
                  label1="Home"
                  label2="Away"
                  value1={trend.publicBetting.moneylineHome}
                  value2={trend.publicBetting.moneylineAway}
                  color1="bg-emerald-500"
                  color2="bg-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Total
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>% of bets on over vs under</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </p>
                <PercentageBar
                  label1="Over"
                  label2="Under"
                  value1={trend.publicBetting.over}
                  value2={trend.publicBetting.under}
                  color1="bg-amber-500"
                  color2="bg-slate-400"
                />
              </div>
            </div>
            
            {/* Money vs Bets comparison */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Money Flow vs Ticket Count
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Home Money</p>
                  <p className="font-mono font-medium">{trend.moneyFlow.homeMoneyPct.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Away Money</p>
                  <p className="font-mono font-medium">{trend.moneyFlow.awayMoneyPct.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sharp" className="mt-0">
            <SharpIndicator trend={trend} />
          </TabsContent>
          
          <TabsContent value="lines" className="mt-0">
            <LineMovementDisplay trend={trend} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default BettingTrendsCard;
