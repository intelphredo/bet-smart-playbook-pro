import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Target, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  Calendar,
  Clock,
  ChevronRight,
  ExternalLink,
  Trophy,
  Sparkles,
  Star
} from 'lucide-react';
import { useRecommendedPicks, RecommendedPick } from '@/hooks/useRecommendedPicks';
import { AlgorithmType } from '@/utils/predictions/algorithms';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ALGORITHM_OPTIONS: { label: string; value: AlgorithmType }[] = [
  { label: 'ML Power Index', value: 'ML_POWER_INDEX' },
  { label: 'Value Pick Finder', value: 'VALUE_PICK_FINDER' },
  { label: 'Statistical Edge', value: 'STATISTICAL_EDGE' },
];

function PickCard({ pick, onViewDetails, index }: { pick: RecommendedPick; onViewDetails: (pick: RecommendedPick) => void; index: number }) {
  const matchDate = parseISO(pick.match.startTime);
  const timeLabel = formatDistanceToNow(matchDate, { addSuffix: true });
  
  const isTopPick = index === 0;
  const confidenceColor = pick.confidence >= 70 
    ? 'text-emerald-500' 
    : pick.confidence >= 60 
      ? 'text-primary' 
      : 'text-muted-foreground';

  const evColor = pick.evPercentage >= 5 
    ? 'text-emerald-500' 
    : pick.evPercentage >= 2 
      ? 'text-primary' 
      : 'text-muted-foreground';

  return (
    <div 
      className={cn(
        "relative p-4 rounded-lg border transition-all duration-300 cursor-pointer group overflow-hidden",
        isTopPick 
          ? "bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/30 hover:border-primary/50 shadow-lg shadow-primary/5" 
          : "bg-card hover:bg-accent/50 border-border/50 hover:border-primary/20",
        "hover:shadow-md hover:scale-[1.01]"
      )}
      onClick={() => onViewDetails(pick)}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      {/* Top pick indicator */}
      {isTopPick && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      )}

      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex-1 min-w-0">
          {/* Match Info */}
          <div className="flex items-center gap-2 mb-2">
            {isTopPick && (
              <Badge variant="gold" className="text-xs gap-1">
                <Trophy className="h-3 w-3" />
                Top Pick
              </Badge>
            )}
            <Badge variant="outline" className="text-xs bg-muted/30">
              {pick.match.league}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLabel}
            </span>
          </div>
          
          <p className={cn(
            "font-medium text-sm mb-1",
            isTopPick && "text-foreground"
          )}>
            {pick.match.homeTeam.shortName} vs {pick.match.awayTeam.shortName}
          </p>
          
          {/* Recommendation */}
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(
              "transition-all",
              isTopPick 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm" 
                : "bg-primary/20 text-primary border-primary/30"
            )}>
              {pick.recommendedTeam}
            </Badge>
            <span className="text-xs text-muted-foreground">
              @ {pick.odds > 0 ? '+' : ''}{Math.round(pick.odds)}
            </span>
          </div>

          {/* Click hint */}
          <div className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
            <ExternalLink className="h-3 w-3" />
            Click for details
          </div>
        </div>

        {/* Stats */}
        <div className="text-right space-y-1.5">
          <div className="flex items-center justify-end gap-1.5 p-1.5 rounded-md bg-muted/30">
            <Target className={cn("h-3.5 w-3.5", confidenceColor)} />
            <span className={cn("text-sm font-bold", confidenceColor)}>
              {pick.confidence}%
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 p-1.5 rounded-md bg-muted/30">
            <TrendingUp className={cn("h-3.5 w-3.5", evColor)} />
            <span className={cn("text-sm font-bold", evColor)}>
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
  const [selectedPick, setSelectedPick] = useState<RecommendedPick | null>(null);

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
    minEV: -5,
    limit: 15,
  });

  const displayPicks = viewMode === 'confidence' ? topByConfidence : topByEV;
  const qualifiedPicks = picks.filter(p => p.evPercentage > 0 && p.confidence >= 55);

  const handleViewDetails = (pick: RecommendedPick) => {
    setSelectedPick(pick);
  };

  if (isLoading) {
    return (
      <Card variant="premium">
        <CardContent className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="premium">
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
    <>
      <Card variant="premium" className="overflow-hidden">
        {/* Premium top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        <CardHeader className="pb-3 bg-gradient-to-br from-muted/20 via-transparent to-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="relative">
                <Zap className="h-5 w-5 text-primary" />
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Algorithm Recommended Picks
              </span>
              <Sparkles className="h-4 w-4 text-primary/60 animate-pulse" />
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as AlgorithmType)}>
                <SelectTrigger className="w-[160px] h-8 text-xs bg-muted/30 border-border/50 hover:border-primary/30 transition-colors">
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
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" 
                onClick={refetch}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {lastRefreshTime && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Updated {formatDistanceToNow(parseISO(lastRefreshTime), { addSuffix: true })} • 
              {totalUpcoming} upcoming games • 
              <span className="text-primary font-medium">{qualifiedPicks.length} qualified picks</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="relative">
          {picks.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative inline-block">
                <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <div className="absolute inset-0 bg-muted-foreground/10 blur-xl rounded-full" />
              </div>
              <h3 className="text-base font-medium mb-1">No Recommended Picks</h3>
              <p className="text-sm text-muted-foreground">
                No upcoming matches meet the prediction criteria right now.
              </p>
            </div>
          ) : (
            <>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'confidence' | 'value')}>
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/30 p-1">
                  <TabsTrigger 
                    value="value" 
                    className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary transition-all"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Top Value (+EV)
                  </TabsTrigger>
                  <TabsTrigger 
                    value="confidence" 
                    className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary transition-all"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    High Confidence
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="value" className="mt-0">
                  <div className="space-y-3">
                    {topByEV.map((pick, index) => (
                      <PickCard key={pick.match.id} pick={pick} onViewDetails={handleViewDetails} index={index} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="confidence" className="mt-0">
                  <div className="space-y-3">
                    {topByConfidence.map((pick, index) => (
                      <PickCard key={pick.match.id} pick={pick} onViewDetails={handleViewDetails} index={index} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {picks.length > 3 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Link to="/algorithms">
                    <Button 
                      variant="outline" 
                      className="w-full group bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all" 
                      size="sm"
                    >
                      View All {picks.length} Predictions
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pick Detail Modal */}
      <Dialog open={!!selectedPick} onOpenChange={(open) => !open && setSelectedPick(null)}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
          {/* Premium accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          
          {selectedPick && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="relative">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div className="absolute inset-0 bg-primary/30 blur-sm rounded-full" />
                  </div>
                  {selectedPick.match.homeTeam.name} vs {selectedPick.match.awayTeam.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Algorithm & League */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-muted/30">{selectedPick.match.league}</Badge>
                  <Badge variant="gold" className="gap-1">
                    <Star className="h-3 w-3" />
                    {selectedPick.algorithmName}
                  </Badge>
                </div>

                {/* Recommendation */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 via-muted/30 to-primary/5 border border-border/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Recommendation
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg px-3 py-1 shadow-lg shadow-emerald-500/25">
                      {selectedPick.recommendedTeam}
                    </Badge>
                    <span className="text-muted-foreground">@ {selectedPick.odds > 0 ? '+' : ''}{Math.round(selectedPick.odds)}</span>
                  </div>
                </div>

                {/* Projected Score */}
                <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                  <h4 className="font-semibold mb-2">Projected Score</h4>
                  <div className="flex justify-center items-center gap-4 text-2xl font-bold">
                    <span>{selectedPick.match.homeTeam.shortName}</span>
                    <span className="text-primary bg-primary/10 px-3 py-1 rounded-md">
                      {selectedPick.projectedScore.home} - {selectedPick.projectedScore.away}
                    </span>
                    <span>{selectedPick.match.awayTeam.shortName}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-transparent text-center group hover:border-primary/30 transition-colors">
                    <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className={cn(
                      "text-lg font-bold",
                      selectedPick.confidence >= 70 ? 'text-emerald-500' : selectedPick.confidence >= 60 ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {selectedPick.confidence}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-transparent text-center group hover:border-primary/30 transition-colors">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-xs text-muted-foreground">Expected Value</div>
                    <div className={cn(
                      "text-lg font-bold",
                      selectedPick.evPercentage >= 5 ? 'text-emerald-500' : selectedPick.evPercentage >= 2 ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      +{selectedPick.evPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-transparent text-center group hover:border-primary/30 transition-colors">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-xs text-muted-foreground">Kelly Stake</div>
                    <div className="text-lg font-bold">
                      {selectedPick.kellyStakeUnits.toFixed(1)}u
                    </div>
                  </div>
                </div>

                {/* Match Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-muted/20">
                  <Clock className="h-4 w-4 text-primary/60" />
                  <span>Starts {formatDistanceToNow(parseISO(selectedPick.match.startTime), { addSuffix: true })}</span>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all"
                  onClick={() => setSelectedPick(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
