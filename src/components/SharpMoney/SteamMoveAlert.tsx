// Steam Move Alert Component
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, TrendingUp, TrendingDown, Clock, X, 
  AlertTriangle, Activity, ChevronRight 
} from 'lucide-react';
import { SteamMove } from '@/hooks/useSteamMoveDetector';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SteamMoveAlertProps {
  moves: SteamMove[];
  onDismiss?: (id: string) => void;
  onViewMatch?: (matchId: string) => void;
  compact?: boolean;
  className?: string;
}

const STRENGTH_STYLES = {
  extreme: {
    bg: 'bg-red-500/10 border-red-500/50',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500 text-white',
    icon: AlertTriangle,
  },
  strong: {
    bg: 'bg-orange-500/10 border-orange-500/50',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500 text-white',
    icon: Zap,
  },
  moderate: {
    bg: 'bg-yellow-500/10 border-yellow-500/50',
    text: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-500 text-white',
    icon: Activity,
  },
};

const MARKET_LABELS = {
  spread: 'Spread',
  moneyline: 'ML',
  total: 'Total',
};

export function SteamMoveAlert({ 
  moves, 
  onDismiss, 
  onViewMatch,
  compact = false,
  className 
}: SteamMoveAlertProps) {
  if (moves.length === 0) return null;

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <AnimatePresence>
          {moves.slice(0, 5).map((move) => {
            const style = STRENGTH_STYLES[move.strength];
            const Icon = style.icon;
            
            return (
              <motion.div
                key={move.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border',
                  style.bg
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn('h-4 w-4 shrink-0', style.text)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{move.matchTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {MARKET_LABELS[move.marketType]} {move.side.toUpperCase()}: {move.movement > 0 ? '+' : ''}{move.movement.toFixed(1)} pts
                    </p>
                  </div>
                </div>
                {onViewMatch && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => onViewMatch(move.matchId)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-orange-500" />
            Steam Moves Detected
            <Badge variant="destructive" className="animate-pulse">
              {moves.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          <AnimatePresence>
            {moves.map((move, index) => {
              const style = STRENGTH_STYLES[move.strength];
              const Icon = style.icon;
              const isPositive = move.movement > 0;
              
              return (
                <motion.div
                  key={move.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'border-b last:border-b-0 p-4',
                    style.bg
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg shrink-0',
                        move.strength === 'extreme' ? 'bg-red-500/20' :
                        move.strength === 'strong' ? 'bg-orange-500/20' :
                        'bg-yellow-500/20'
                      )}>
                        <Icon className={cn('h-5 w-5', style.text)} />
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={style.badge}>
                            {move.strength.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {move.league}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {move.sportsbook}
                          </Badge>
                        </div>
                        
                        <h4 className="font-semibold mt-2">{move.matchTitle}</h4>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{MARKET_LABELS[move.marketType]}:</span>
                            <span className="font-mono">{move.previousValue.toFixed(1)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono font-bold">{move.currentValue.toFixed(1)}</span>
                          </div>
                          
                          <div className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                            isPositive ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                          )}>
                            {isPositive ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {isPositive ? '+' : ''}{move.movement.toFixed(1)} pts
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(move.timeWindow / 60)} min window
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(move.detectedAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {/* Sharp play indicator */}
                        <div className={cn(
                          'mt-3 p-2 rounded-lg text-sm font-medium',
                          'bg-primary/10 border border-primary/20'
                        )}>
                          <span className="text-primary">Sharp Play: </span>
                          <span className="text-foreground">{move.side.toUpperCase()}</span>
                          <span className="text-muted-foreground ml-2">
                            (Money flowing toward {move.side})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0">
                      {onViewMatch && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewMatch(move.matchId)}
                        >
                          View Game
                        </Button>
                      )}
                      {onDismiss && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onDismiss(move.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default SteamMoveAlert;
