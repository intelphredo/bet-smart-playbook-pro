import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  BellOff,
  Activity,
  Users,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BettingTrend, SharpSignal } from '@/types/bettingTrends';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SharpMoneyAlertBannerProps {
  trend: BettingTrend | null;
  isLoading?: boolean;
  onEnableAlerts?: () => void;
  alertsEnabled?: boolean;
}

const SIGNAL_ICONS: Record<SharpSignal['type'], React.ReactNode> = {
  'steam_move': <Zap className="h-4 w-4" />,
  'reverse_line': <TrendingDown className="h-4 w-4" />,
  'line_freeze': <Activity className="h-4 w-4" />,
  'whale_bet': <DollarSign className="h-4 w-4" />,
  'syndicate_play': <Users className="h-4 w-4" />,
};

const SIGNAL_COLORS: Record<SharpSignal['type'], string> = {
  'steam_move': 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  'reverse_line': 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  'line_freeze': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  'whale_bet': 'text-green-500 bg-green-500/10 border-green-500/30',
  'syndicate_play': 'text-red-500 bg-red-500/10 border-red-500/30',
};

export function SharpMoneyAlertBanner({ 
  trend, 
  isLoading,
  onEnableAlerts,
  alertsEnabled = true 
}: SharpMoneyAlertBannerProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-4">
          <div className="h-16 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  
  if (!trend) return null;
  
  const hasSharpSignals = trend.sharpBetting.signals.length > 0;
  const hasRLM = trend.lineMovement.reverseLineMovement;
  const strongSignals = trend.sharpBetting.signals.filter(s => s.strength === 'strong');
  
  if (!hasSharpSignals && !hasRLM) {
    return (
      <Card className="border-muted">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Brain className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Sharp Signals</p>
                <p className="text-xs text-muted-foreground">
                  Normal betting activity on this game
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              Confidence: {trend.sharpBetting.confidence}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        'overflow-hidden border-2',
        hasRLM ? 'border-purple-500/50 bg-purple-500/5' : 'border-orange-500/50 bg-orange-500/5'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {hasRLM ? (
                <Zap className="h-5 w-5 text-purple-500" />
              ) : (
                <Brain className="h-5 w-5 text-orange-500" />
              )}
              <span className={hasRLM ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}>
                {hasRLM ? 'Reverse Line Movement Detected' : 'Sharp Money Signal'}
              </span>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  'font-mono',
                  trend.sharpBetting.confidence >= 70 
                    ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                )}
              >
                {trend.sharpBetting.confidence}% Confidence
              </Badge>
              
              {onEnableAlerts && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={onEnableAlerts}
                      >
                        {alertsEnabled ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {alertsEnabled ? 'Alerts enabled' : 'Enable alerts'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* RLM Explanation */}
          {hasRLM && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Line moving against public betting
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trend.publicBetting.spreadHome > 55 
                      ? `${trend.publicBetting.spreadHome.toFixed(0)}% of bets on ${trend.homeTeam.split(' ').pop()}, but line moved to favor ${trend.awayTeam.split(' ').pop()}`
                      : `${trend.publicBetting.spreadAway.toFixed(0)}% of bets on ${trend.awayTeam.split(' ').pop()}, but line moved to favor ${trend.homeTeam.split(' ').pop()}`
                    }
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="font-mono">
                      Spread: {trend.lineMovement.openSpread > 0 ? '+' : ''}{trend.lineMovement.openSpread.toFixed(1)} → 
                      {trend.lineMovement.currentSpread > 0 ? '+' : ''}{trend.lineMovement.currentSpread.toFixed(1)}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      Math.abs(trend.lineMovement.spreadMovement) >= 1.5 
                        ? 'bg-red-500/20 text-red-600' 
                        : 'bg-amber-500/20 text-amber-600'
                    )}>
                      {trend.lineMovement.spreadMovement > 0 ? '+' : ''}{trend.lineMovement.spreadMovement.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Sharp Signals */}
          {trend.sharpBetting.signals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Detected Signals
              </p>
              <div className="grid gap-2">
                <AnimatePresence>
                  {trend.sharpBetting.signals.map((signal, i) => (
                    <motion.div
                      key={`${signal.type}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        SIGNAL_COLORS[signal.type],
                        signal.strength === 'strong' && 'border-2'
                      )}
                    >
                      <div className="flex-shrink-0">
                        {SIGNAL_ICONS[signal.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">
                            {signal.type.replace(/_/g, ' ')}
                          </span>
                          {signal.strength === 'strong' && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              STRONG
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {signal.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {signal.side}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          {/* Sharp Pick Summary */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className={cn(
              'text-center p-2 rounded-lg',
              trend.sharpBetting.spreadFavorite !== 'neutral' && 'bg-muted'
            )}>
              <p className="text-xs text-muted-foreground">Spread</p>
              <p className={cn(
                'font-semibold text-sm capitalize',
                trend.sharpBetting.spreadFavorite !== 'neutral' && 'text-primary'
              )}>
                {trend.sharpBetting.spreadFavorite === 'neutral' 
                  ? '—' 
                  : trend.sharpBetting.spreadFavorite === 'home' 
                    ? trend.homeTeam.split(' ').pop() 
                    : trend.awayTeam.split(' ').pop()
                }
              </p>
            </div>
            <div className={cn(
              'text-center p-2 rounded-lg',
              trend.sharpBetting.moneylineFavorite !== 'neutral' && 'bg-muted'
            )}>
              <p className="text-xs text-muted-foreground">Moneyline</p>
              <p className={cn(
                'font-semibold text-sm capitalize',
                trend.sharpBetting.moneylineFavorite !== 'neutral' && 'text-primary'
              )}>
                {trend.sharpBetting.moneylineFavorite === 'neutral' 
                  ? '—' 
                  : trend.sharpBetting.moneylineFavorite === 'home' 
                    ? trend.homeTeam.split(' ').pop() 
                    : trend.awayTeam.split(' ').pop()
                }
              </p>
            </div>
            <div className={cn(
              'text-center p-2 rounded-lg',
              trend.sharpBetting.totalFavorite !== 'neutral' && 'bg-muted'
            )}>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className={cn(
                'font-semibold text-sm capitalize',
                trend.sharpBetting.totalFavorite !== 'neutral' && 'text-primary'
              )}>
                {trend.sharpBetting.totalFavorite === 'neutral' ? '—' : trend.sharpBetting.totalFavorite}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SharpMoneyAlertBanner;
