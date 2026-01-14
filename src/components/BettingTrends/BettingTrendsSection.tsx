import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  RefreshCw, 
  Brain, 
  Users, 
  AlertTriangle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { League } from '@/types/sports';
import { useBettingTrends } from '@/hooks/useBettingTrends';
import { BettingTrend } from '@/types/bettingTrends';
import BettingTrendsCard from './BettingTrendsCard';
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from '@/components/filters/GroupedLeagueSelect';
import { getLeagueDisplayName } from '@/utils/teamLogos';

// All available leagues for the filter
const ALL_LEAGUES: League[] = [
  'NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 
  'WNBA', 'EPL', 'LA_LIGA', 'SERIE_A', 'BUNDESLIGA', 
  'LIGUE_1', 'MLS', 'CHAMPIONS_LEAGUE', 'UFC'
];

function TrendSummaryRow({ trend, onClick }: { trend: BettingTrend; onClick: () => void }) {
  const hasSharpSignals = trend.sharpBetting.signals.length > 0;
  const hasRLM = trend.lineMovement.reverseLineMovement;
  const publicFavorite = trend.publicBetting.spreadHome > 55 ? 'home' : 
                         trend.publicBetting.spreadAway > 55 ? 'away' : null;
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left',
        hasSharpSignals && 'border-purple-500/30'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {trend.awayTeam.split(' ').pop()} @ {trend.homeTeam.split(' ').pop()}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {hasRLM && (
            <Badge variant="outline" className="text-purple-500 bg-purple-500/10 text-xs px-1.5">
              <Zap className="h-3 w-3" />
            </Badge>
          )}
          {hasSharpSignals && (
            <Badge variant="outline" className="text-purple-500 bg-purple-500/10 text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Sharp
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {trend.publicBetting.spreadHome.toFixed(0)}% / {trend.publicBetting.spreadAway.toFixed(0)}%
        </span>
        {publicFavorite && (
          <span className={cn(
            'px-1.5 py-0.5 rounded text-xs',
            publicFavorite === 'home' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-500/10 text-slate-600'
          )}>
            Public: {publicFavorite === 'home' ? trend.homeTeam.split(' ').pop() : trend.awayTeam.split(' ').pop()}
          </span>
        )}
      </div>
      
      {/* Sharp signals preview */}
      {hasSharpSignals && (
        <div className="flex gap-1 mt-2">
          {trend.sharpBetting.signals.slice(0, 2).map((signal, i) => (
            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
              {signal.type.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}

interface BettingTrendsSectionProps {
  league?: League;
}

export function BettingTrendsSection({ league: initialLeague }: BettingTrendsSectionProps) {
  const [activeLeague, setActiveLeague] = useState<League>(initialLeague || 'NBA');
  const [selectedTrend, setSelectedTrend] = useState<BettingTrend | null>(null);
  
  const { data: trends, isLoading, error, refetch, isFetching } = useBettingTrends(activeLeague);
  
  const sharpActionGames = trends?.filter(t => t.sharpBetting.signals.length > 0) || [];
  const rlmGames = trends?.filter(t => t.lineMovement.reverseLineMovement) || [];
  
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load betting trends</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Betting Trends</h2>
            <p className="text-muted-foreground text-sm">
              Public vs sharp betting analysis with line movement tracking
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      {/* League Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">League:</span>
        <GroupedLeagueSelect
          value={activeLeague}
          onValueChange={(v) => setActiveLeague(v as League)}
          leagues={ALL_LEAGUES}
          showAllOption={false}
          className="w-[200px]"
        />
      </div>
      
      {/* Stats Summary */}
      {!isLoading && trends && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Games</p>
                  <p className="text-2xl font-bold">{trends.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(sharpActionGames.length > 0 && 'border-purple-500/30')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sharp Action</p>
                  <p className="text-2xl font-bold text-purple-600">{sharpActionGames.length}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(rlmGames.length > 0 && 'border-orange-500/30')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reverse Line</p>
                  <p className="text-2xl font-bold text-orange-600">{rlmGames.length}</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Games List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Today's Games
            </CardTitle>
            <CardDescription>
              Click a game to see detailed betting trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : trends && trends.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {trends.map((trend) => (
                    <TrendSummaryRow 
                      key={trend.matchId} 
                      trend={trend} 
                      onClick={() => setSelectedTrend(trend)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2" />
                <p>No games available for {activeLeague}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Selected Game Detail */}
        <div>
          {selectedTrend ? (
            <BettingTrendsCard trend={selectedTrend} />
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a game to view detailed betting trends
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default BettingTrendsSection;
