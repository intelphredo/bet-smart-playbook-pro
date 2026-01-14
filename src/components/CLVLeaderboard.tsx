import { memo } from 'react';
import { Trophy, TrendingUp, Medal, Target, Users, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCLVLeaderboard, LeaderboardEntry } from '@/hooks/useCLVLeaderboard';
import VirtualizedList from '@/components/VirtualizedList';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { isDevMode } from '@/utils/devMode';
import { useNavigate } from 'react-router-dom';
import { InfoExplainer } from '@/components/ui/InfoExplainer';

function getRankBadge(rank: number) {
  const baseClasses = "w-6 h-6 flex items-center justify-center";
  
  switch (rank) {
    case 1:
      return (
        <div className={cn(baseClasses, "animate-scale-subtle")}>
          <Crown className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
        </div>
      );
    case 2:
      return (
        <div className={baseClasses}>
          <Medal className="w-5 h-5 text-slate-400" />
        </div>
      );
    case 3:
      return (
        <div className={baseClasses}>
          <Medal className="w-5 h-5 text-amber-600" />
        </div>
      );
    default:
      return (
        <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground bg-muted rounded-full">
          {rank}
        </span>
      );
  }
}

// Memoized row component
const LeaderboardRow = memo(function LeaderboardRow({ 
  entry, 
  rank, 
  isCurrentUser 
}: { 
  entry: LeaderboardEntry; 
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        rank <= 3 && "bg-gradient-to-r from-primary/5 to-transparent",
        isCurrentUser && "bg-primary/10 ring-1 ring-primary/30"
      )}
    >
      <div className="flex-shrink-0 w-8">
        {getRankBadge(rank)}
      </div>

      <Avatar className="h-9 w-9">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {entry.display_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm truncate",
          isCurrentUser && "text-primary"
        )}>
          {entry.display_name}
          {isCurrentUser && (
            <Badge variant="outline" className="ml-2 text-xs">You</Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.total_bets_with_clv} bets tracked
        </p>
      </div>

      <div className="flex items-center gap-4 text-right">
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground">+CLV Rate</p>
          <p className="text-sm font-medium">{entry.positive_clv_rate}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg CLV</p>
          <p className={cn(
            "text-sm font-bold",
            entry.avg_clv > 0 ? "text-emerald-500" : "text-destructive"
          )}>
            {entry.avg_clv > 0 ? '+' : ''}{entry.avg_clv}%
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-xs text-muted-foreground">ROI</p>
          <p className={cn(
            "text-sm font-medium",
            entry.roi_percentage > 0 ? "text-emerald-500" : "text-destructive"
          )}>
            {entry.roi_percentage > 0 ? '+' : ''}{entry.roi_percentage}%
          </p>
        </div>
      </div>
    </div>
  );
});

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyLeaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/5 flex items-center justify-center animate-float">
          <Trophy className="w-10 h-10 text-yellow-500/70" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center animate-scale-subtle">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Be the First Champion</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] mb-1">
        Track your bets to see how you stack up against other sharp bettors.
      </p>
      <p className="text-xs text-muted-foreground mb-5">
        Minimum 5 tracked bets required to qualify
      </p>
      
      <Button 
        onClick={() => user ? navigate('/bet-history') : navigate('/auth')}
        className="gap-2"
        variant="premium"
      >
        {user ? 'Start Tracking Bets' : 'Sign Up to Compete'}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CLVLeaderboard() {
  const { leaderboard, isLoading, error } = useCLVLeaderboard();
  const { user } = useAuth();
  const devMode = isDevMode();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            CLV Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load leaderboard</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-yellow-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            CLV Leaderboard
            <InfoExplainer term="clv" size="sm" />
          </CardTitle>
          {leaderboard.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {leaderboard.length} bettors
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Top performers by Closing Line Value (min. 5 tracked bets)
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : leaderboard.length === 0 ? (
          <EmptyLeaderboard />
        ) : (
          <VirtualizedList
            items={leaderboard}
            maxHeight={400}
            estimatedItemHeight={72}
            renderItem={(entry, index) => (
              <LeaderboardRow
                entry={entry}
                rank={index + 1}
                isCurrentUser={user?.id === entry.user_id || (devMode && index === 2)}
              />
            )}
          />
        )}

        {leaderboard.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                <strong>CLV (Closing Line Value)</strong> measures how well you beat the market. 
                Positive CLV means you consistently get better odds than where the line closes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
