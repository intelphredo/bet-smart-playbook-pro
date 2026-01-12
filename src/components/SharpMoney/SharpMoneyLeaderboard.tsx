// Sharp Money Leaderboard Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Zap, TrendingDown, TrendingUp, Activity, 
  DollarSign, Users, Trophy, Target, BarChart3, 
  Clock, CheckCircle, XCircle, MinusCircle
} from 'lucide-react';
import { 
  useSharpMoneyLeaderboard, 
  useRecentSharpPredictions,
  SignalStats,
  RecentPrediction
} from '@/hooks/useSharpMoneyLeaderboard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const SIGNAL_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  reverse_line: { icon: TrendingDown, color: 'text-purple-500', label: 'Reverse Line Movement' },
  steam_move: { icon: Zap, color: 'text-orange-500', label: 'Steam Move' },
  line_freeze: { icon: Activity, color: 'text-blue-500', label: 'Line Freeze' },
  whale_bet: { icon: DollarSign, color: 'text-green-500', label: 'Whale Bet' },
  syndicate_play: { icon: Users, color: 'text-red-500', label: 'Syndicate Play' },
};

const RESULT_CONFIG = {
  won: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  lost: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  push: { icon: MinusCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
};

interface SharpMoneyLeaderboardProps {
  className?: string;
  compact?: boolean;
}

export function SharpMoneyLeaderboard({ className, compact = false }: SharpMoneyLeaderboardProps) {
  const [activeTab, setActiveTab] = useState('signals');
  const { data: leaderboard, isLoading: loadingLeaderboard } = useSharpMoneyLeaderboard();
  const { data: recentPredictions, isLoading: loadingRecent } = useRecentSharpPredictions(10);

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Sharp Signal Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingLeaderboard ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard?.slice(0, 5).map((stat, i) => (
                <CompactLeaderboardRow key={stat.signalType} stat={stat} rank={i + 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-4 px-6 bg-gradient-to-r from-purple-500/10 via-orange-500/10 to-green-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Sharp Money Leaderboard
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            Historical Accuracy
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b px-4">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger value="signals" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              By Signal Type
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="h-4 w-4" />
              Recent Picks
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="signals" className="m-0">
          <CardContent className="p-0">
            {loadingLeaderboard ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {leaderboard?.map((stat, i) => (
                    <LeaderboardRow key={stat.signalType} stat={stat} rank={i + 1} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="recent" className="m-0">
          <CardContent className="p-0">
            {loadingRecent ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {recentPredictions?.map((pred) => (
                    <RecentPredictionRow key={pred.id} prediction={pred} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// Compact row for sidebar
function CompactLeaderboardRow({ stat, rank }: { stat: SignalStats; rank: number }) {
  const config = SIGNAL_CONFIG[stat.signalType] || { 
    icon: Brain, 
    color: 'text-muted-foreground', 
    label: stat.signalType 
  };
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
          rank === 1 && 'bg-yellow-500 text-yellow-950',
          rank === 2 && 'bg-gray-300 text-gray-700',
          rank === 3 && 'bg-orange-400 text-orange-950',
          rank > 3 && 'bg-muted text-muted-foreground'
        )}>
          {rank}
        </span>
        <Icon className={cn('h-4 w-4', config.color)} />
        <span className="text-sm font-medium truncate max-w-[100px]">
          {config.label.split(' ')[0]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-mono text-sm font-bold',
          stat.winRate >= 55 ? 'text-green-500' : 
          stat.winRate >= 50 ? 'text-yellow-500' : 'text-red-500'
        )}>
          {stat.winRate}%
        </span>
        <span className="text-xs text-muted-foreground">
          ({stat.wins}-{stat.losses})
        </span>
      </div>
    </div>
  );
}

// Full leaderboard row
function LeaderboardRow({ stat, rank }: { stat: SignalStats; rank: number }) {
  const config = SIGNAL_CONFIG[stat.signalType] || { 
    icon: Brain, 
    color: 'text-muted-foreground', 
    label: stat.signalType 
  };
  const Icon = config.icon;
  const totalGraded = stat.wins + stat.losses + stat.pushes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0',
          rank === 1 && 'bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500',
          rank === 2 && 'bg-gray-300/30 text-gray-600 border-2 border-gray-400',
          rank === 3 && 'bg-orange-400/20 text-orange-600 border-2 border-orange-400',
          rank > 3 && 'bg-muted text-muted-foreground border border-border'
        )}>
          #{rank}
        </div>
        
        {/* Signal Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn('h-5 w-5', config.color)} />
            <h3 className="font-semibold">{config.label}</h3>
            <Badge variant="secondary" className="text-xs">
              {stat.totalPredictions} picks
            </Badge>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mt-3">
            <StatBox 
              label="Win Rate" 
              value={`${stat.winRate}%`}
              highlight={stat.winRate >= 55}
            />
            <StatBox 
              label="Record" 
              value={`${stat.wins}-${stat.losses}${stat.pushes > 0 ? `-${stat.pushes}` : ''}`}
            />
            <StatBox 
              label="Avg Conf" 
              value={`${stat.avgConfidence}%`}
            />
            <StatBox 
              label="CLV Rate" 
              value={`${stat.clvRate}%`}
              highlight={stat.clvRate >= 60}
            />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Win Rate Progress</span>
              <span>{stat.winRate}% / 55% target</span>
            </div>
            <Progress 
              value={Math.min(stat.winRate / 55 * 100, 100)} 
              className={cn(
                'h-2',
                stat.winRate >= 55 ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'
              )}
            />
          </div>
        </div>
        
        {/* Win Rate Circle */}
        <div className={cn(
          'w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0',
          stat.winRate >= 55 ? 'border-green-500 bg-green-500/10' :
          stat.winRate >= 50 ? 'border-yellow-500 bg-yellow-500/10' :
          'border-red-500 bg-red-500/10'
        )}>
          <span className={cn(
            'text-xl font-bold',
            stat.winRate >= 55 ? 'text-green-600' :
            stat.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {stat.winRate}%
          </span>
          <span className="text-[10px] text-muted-foreground">WIN RATE</span>
        </div>
      </div>
    </motion.div>
  );
}

// Recent prediction row
function RecentPredictionRow({ prediction }: { prediction: RecentPrediction }) {
  const signalConfig = SIGNAL_CONFIG[prediction.signalType] || { 
    icon: Brain, 
    color: 'text-muted-foreground', 
    label: prediction.signalType 
  };
  const resultConfig = RESULT_CONFIG[prediction.gameResult as keyof typeof RESULT_CONFIG] || RESULT_CONFIG.pending;
  const SignalIcon = signalConfig.icon;
  const ResultIcon = resultConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('p-2 rounded-lg', resultConfig.bg)}>
            <ResultIcon className={cn('h-4 w-4', resultConfig.color)} />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {prediction.league}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn('text-[10px]', signalConfig.color)}
              >
                <SignalIcon className="h-3 w-3 mr-1" />
                {signalConfig.label.split(' ')[0]}
              </Badge>
            </div>
            <p className="font-medium text-sm mt-1 truncate">{prediction.matchTitle}</p>
            <p className="text-xs text-muted-foreground">
              Sharp: <span className="font-medium">{prediction.sharpSide.toUpperCase()}</span>
              {' • '}
              {formatDistanceToNow(new Date(prediction.detectedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          {prediction.gameResult !== 'pending' && (
            <p className="text-sm font-mono">
              {prediction.actualScoreAway} - {prediction.actualScoreHome}
            </p>
          )}
          <Badge 
            variant={prediction.gameResult === 'won' ? 'default' : 'secondary'}
            className={cn(
              prediction.gameResult === 'won' && 'bg-green-500',
              prediction.gameResult === 'lost' && 'bg-red-500 text-white',
            )}
          >
            {prediction.gameResult.toUpperCase()}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

// Stat box component
function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={cn(
        'font-mono font-bold text-lg',
        highlight ? 'text-green-500' : 'text-foreground'
      )}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default SharpMoneyLeaderboard;
