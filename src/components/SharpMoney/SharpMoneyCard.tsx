// Sharp Money Game Card
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, Zap, TrendingDown, TrendingUp, Activity, 
  DollarSign, Users, ChevronRight, Clock 
} from 'lucide-react';
import { SharpMoneyGame } from '@/hooks/useSharpMoneyGames';
import { SharpSignal } from '@/types/bettingTrends';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TeamLogoImage } from '@/components/ui/TeamLogoImage';

interface SharpMoneyCardProps {
  game: SharpMoneyGame;
  onClick?: () => void;
  compact?: boolean;
}

const SIGNAL_ICONS: Record<SharpSignal['type'], React.ReactNode> = {
  'steam_move': <Zap className="h-3.5 w-3.5" />,
  'reverse_line': <TrendingDown className="h-3.5 w-3.5" />,
  'line_freeze': <Activity className="h-3.5 w-3.5" />,
  'whale_bet': <DollarSign className="h-3.5 w-3.5" />,
  'syndicate_play': <Users className="h-3.5 w-3.5" />,
};

const SIGNAL_COLORS: Record<SharpSignal['type'], string> = {
  'steam_move': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'reverse_line': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  'line_freeze': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'whale_bet': 'bg-green-500/10 text-green-600 border-green-500/30',
  'syndicate_play': 'bg-red-500/10 text-red-600 border-red-500/30',
};

export function SharpMoneyCard({ game, onClick, compact = false }: SharpMoneyCardProps) {
  const { match, trend, sharpScore, signalTypes, hasReverseLineMovement, sharpSide, confidence } = game;
  
  // Handle Team objects or strings
  const homeTeamName = typeof match.homeTeam === 'string' ? match.homeTeam : match.homeTeam.name;
  const awayTeamName = typeof match.awayTeam === 'string' ? match.awayTeam : match.awayTeam.name;
  const homeTeamShort = homeTeamName.split(' ').pop() || homeTeamName;
  const awayTeamShort = awayTeamName.split(' ').pop() || awayTeamName;
  const homeTeamLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : undefined;
  const awayTeamLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : undefined;
  
  const sharpTeamName = sharpSide === 'home' ? homeTeamName : sharpSide === 'away' ? awayTeamName : null;
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border cursor-pointer',
          'hover:bg-muted/50 transition-colors',
          hasReverseLineMovement && 'border-purple-500/30 bg-purple-500/5'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm',
            sharpScore >= 70 ? 'bg-green-500/10 text-green-600' :
            sharpScore >= 50 ? 'bg-yellow-500/10 text-yellow-600' :
            'bg-muted text-muted-foreground'
          )}>
            {sharpScore}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <TeamLogoImage
                  teamName={awayTeamName}
                  logoUrl={awayTeamLogo}
                  league={match.league as any}
                  size="xs"
                />
                <span className="text-sm font-medium">{awayTeamShort}</span>
                <span className="text-muted-foreground text-xs">@</span>
                <TeamLogoImage
                  teamName={homeTeamName}
                  logoUrl={homeTeamLogo}
                  league={match.league as any}
                  size="xs"
                />
                <span className="text-sm font-medium">{homeTeamShort}</span>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {match.league}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {signalTypes.slice(0, 2).map(type => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className={cn('text-[10px] px-1.5', SIGNAL_COLORS[type])}
                >
                  {SIGNAL_ICONS[type]}
                  <span className="ml-1">{type.replace(/_/g, ' ')}</span>
                </Badge>
              ))}
              {signalTypes.length > 2 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{signalTypes.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {sharpTeamName && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Sharp: {sharpTeamName.split(' ').pop()}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          hasReverseLineMovement && 'border-purple-500/50 bg-purple-500/5',
          sharpScore >= 70 && !hasReverseLineMovement && 'border-green-500/50 bg-green-500/5'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {match.league}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(match.startTime), 'MMM d, h:mm a')}
                </span>
              </div>
              <h3 className="font-semibold">
                {awayTeamName} @ {homeTeamName}
              </h3>
            </div>
            
            {/* Sharp Score */}
            <div className={cn(
              'flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2',
              sharpScore >= 70 ? 'border-green-500 bg-green-500/10' :
              sharpScore >= 50 ? 'border-yellow-500 bg-yellow-500/10' :
              'border-muted bg-muted/50'
            )}>
              <span className={cn('text-xl font-bold', getScoreColor(sharpScore))}>
                {sharpScore}
              </span>
              <span className="text-[10px] text-muted-foreground">SHARP</span>
            </div>
          </div>
          
          {/* Sharp Signals */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {trend.sharpBetting.signals.map((signal, i) => (
              <Badge 
                key={`${signal.type}-${i}`}
                variant="outline"
                className={cn(
                  'text-xs',
                  SIGNAL_COLORS[signal.type],
                  signal.strength === 'strong' && 'border-2 font-semibold'
                )}
              >
                {SIGNAL_ICONS[signal.type]}
                <span className="ml-1 capitalize">{signal.type.replace(/_/g, ' ')}</span>
                {signal.strength === 'strong' && (
                  <span className="ml-1 text-[10px]">★</span>
                )}
              </Badge>
            ))}
          </div>
          
          {/* RLM Alert */}
          {hasReverseLineMovement && (
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-3">
              <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">Reverse Line Movement</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Spread: {trend.lineMovement.openSpread > 0 ? '+' : ''}{trend.lineMovement.openSpread.toFixed(1)} → 
                {trend.lineMovement.currentSpread > 0 ? '+' : ''}{trend.lineMovement.currentSpread.toFixed(1)}
                <span className={cn(
                  'ml-2 px-1.5 py-0.5 rounded',
                  trend.lineMovement.spreadMovement > 0 ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                )}>
                  {trend.lineMovement.spreadMovement > 0 ? '+' : ''}{trend.lineMovement.spreadMovement.toFixed(1)}
                </span>
              </p>
            </div>
          )}
          
          {/* Public vs Sharp */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                Public
              </div>
              <div className="flex justify-between text-sm">
                <span>{homeTeamShort}</span>
                <span className="font-mono">{trend.publicBetting.spreadHome.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{awayTeamShort}</span>
                <span className="font-mono">{trend.publicBetting.spreadAway.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Brain className="h-3 w-3" />
                Sharp Money
              </div>
              <div className="flex justify-between text-sm">
                <span>{homeTeamShort}</span>
                <span className="font-mono">{trend.moneyFlow.homeMoneyPct.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{awayTeamShort}</span>
                <span className="font-mono">{trend.moneyFlow.awayMoneyPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          
          {/* Sharp Pick */}
          {sharpTeamName && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Sharp Play:</span>
                <Badge className="bg-primary text-primary-foreground">
                  {sharpTeamName}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {confidence}% confidence
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SharpMoneyCard;
