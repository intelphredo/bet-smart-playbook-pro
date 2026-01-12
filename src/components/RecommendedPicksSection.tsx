import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useRecommendedPicks, RecommendedPick } from '@/hooks/useRecommendedPicks';
import { AlgorithmType } from '@/utils/predictions/algorithms';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const ALGORITHM_OPTIONS: { label: string; value: AlgorithmType }[] = [
  { label: 'ML Power Index', value: 'ML_POWER_INDEX' },
  { label: 'Value Pick Finder', value: 'VALUE_PICK_FINDER' },
  { label: 'Statistical Edge', value: 'STATISTICAL_EDGE' },
];

function PickCard({ pick }: { pick: RecommendedPick }) {
  const matchDate = parseISO(pick.match.startTime);
  const timeLabel = formatDistanceToNow(matchDate, { addSuffix: true });
  
  // Determine confidence color
  const confidenceColor = pick.confidence >= 70 
    ? 'text-green-500' 
    : pick.confidence >= 60 
      ? 'text-yellow-500' 
      : 'text-muted-foreground';

  // Determine EV color
  const evColor = pick.evPercentage >= 5 
    ? 'text-green-500' 
    : pick.evPercentage >= 2 
      ? 'text-yellow-500' 
      : 'text-muted-foreground';

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Match Info */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {pick.match.league}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLabel}
            </span>
          </div>
          
          <p className="font-medium text-sm mb-1">
            {pick.match.homeTeam.shortName} vs {pick.match.awayTeam.shortName}
          </p>
          
          {/* Recommendation */}
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {pick.recommendedTeam}
            </Badge>
            <span className="text-xs text-muted-foreground">
              @ {pick.odds.toFixed(2)}
            </span>
          </div>

          {/* Projected Score */}
          <p className="text-xs text-muted-foreground">
            Projected: {pick.projectedScore.home} - {pick.projectedScore.away}
          </p>
        </div>

        {/* Stats */}
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-1">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className={`text-sm font-bold ${confidenceColor}`}>
              {pick.confidence}%
            </span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className={`text-sm font-bold ${evColor}`}>
              +{pick.evPercentage.toFixed(1)}% EV
            </span>
          </div>
          {pick.kellyStakeUnits > 0 && (
            <p className="text-xs text-muted-foreground">
              Kelly: {pick.kellyStakeUnits.toFixed(1)}u
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendedPicksSection() {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('STATISTICAL_EDGE');
  const [viewMode, setViewMode] = useState<'confidence' | 'value'>('value');

  const { 
    picks, 
    topByConfidence, 
    topByEV, 
    isLoading, 
    error,
    lastRefreshTime,
    refetch,
    totalUpcoming 
  } = useRecommendedPicks({
    algorithm,
    minConfidence: 50,
    minEV: -5, // Show all picks, including slight negative EV for comparison
    limit: 15,
  });

  const displayPicks = viewMode === 'confidence' ? topByConfidence : topByEV;
  const qualifiedPicks = picks.filter(p => p.evPercentage > 0 && p.confidence >= 55);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-2">Failed to load predictions</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Algorithm Recommended Picks
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as AlgorithmType)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALGORITHM_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {lastRefreshTime && (
          <p className="text-xs text-muted-foreground mt-1">
            Updated {formatDistanceToNow(parseISO(lastRefreshTime), { addSuffix: true })} • 
            {totalUpcoming} upcoming games • 
            {qualifiedPicks.length} qualified picks
          </p>
        )}
      </CardHeader>

      <CardContent>
        {picks.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base font-medium mb-1">No Recommended Picks</h3>
            <p className="text-sm text-muted-foreground">
              No upcoming matches meet the prediction criteria right now.
            </p>
          </div>
        ) : (
          <>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'confidence' | 'value')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="value" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top Value (+EV)
                </TabsTrigger>
                <TabsTrigger value="confidence" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  High Confidence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="value" className="mt-0">
                <div className="space-y-3">
                  {topByEV.map((pick) => (
                    <PickCard key={pick.match.id} pick={pick} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="confidence" className="mt-0">
                <div className="space-y-3">
                  {topByConfidence.map((pick) => (
                    <PickCard key={pick.match.id} pick={pick} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {picks.length > 3 && (
              <div className="mt-4 pt-4 border-t">
                <Link to="/">
                  <Button variant="outline" className="w-full" size="sm">
                    View All {picks.length} Predictions
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
