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
  Trophy
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

function PickCard({ pick, onViewDetails }: { pick: RecommendedPick; onViewDetails: (pick: RecommendedPick) => void }) {
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
    <div 
      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01]"
      onClick={() => onViewDetails(pick)}
    >
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
              @ {pick.odds > 0 ? '+' : ''}{Math.round(pick.odds)}
            </span>
          </div>

          {/* Click hint */}
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Click for details
          </div>
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
    minEV: -5, // Show all picks, including slight negative EV for comparison
    limit: 15,
  });

  const displayPicks = viewMode === 'confidence' ? topByConfidence : topByEV;
  const qualifiedPicks = picks.filter(p => p.evPercentage > 0 && p.confidence >= 55);

  const handleViewDetails = (pick: RecommendedPick) => {
    setSelectedPick(pick);
  };

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
    <>
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
                      <PickCard key={pick.match.id} pick={pick} onViewDetails={handleViewDetails} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="confidence" className="mt-0">
                  <div className="space-y-3">
                    {topByConfidence.map((pick) => (
                      <PickCard key={pick.match.id} pick={pick} onViewDetails={handleViewDetails} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {picks.length > 3 && (
                <div className="mt-4 pt-4 border-t">
                  <Link to="/algorithms">
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

      {/* Pick Detail Modal */}
      <Dialog open={!!selectedPick} onOpenChange={(open) => !open && setSelectedPick(null)}>
        <DialogContent className="max-w-lg">
          {selectedPick && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {selectedPick.match.homeTeam.name} vs {selectedPick.match.awayTeam.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Algorithm & League */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedPick.match.league}</Badge>
                  <Badge className="bg-primary/20 text-primary">{selectedPick.algorithmName}</Badge>
                </div>

                {/* Recommendation */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">AI Recommendation</h4>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                      {selectedPick.recommendedTeam}
                    </Badge>
                    <span className="text-muted-foreground">@ {selectedPick.odds > 0 ? '+' : ''}{Math.round(selectedPick.odds)}</span>
                  </div>
                </div>

                {/* Projected Score */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Projected Score</h4>
                  <div className="flex justify-center items-center gap-4 text-2xl font-bold">
                    <span>{selectedPick.match.homeTeam.shortName}</span>
                    <span className="text-primary">{selectedPick.projectedScore.home} - {selectedPick.projectedScore.away}</span>
                    <span>{selectedPick.match.awayTeam.shortName}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className={`text-lg font-bold ${selectedPick.confidence >= 70 ? 'text-green-500' : selectedPick.confidence >= 60 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {selectedPick.confidence}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Expected Value</div>
                    <div className={`text-lg font-bold ${selectedPick.evPercentage >= 5 ? 'text-green-500' : selectedPick.evPercentage >= 2 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      +{selectedPick.evPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border text-center">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Kelly Stake</div>
                    <div className="text-lg font-bold">
                      {selectedPick.kellyStakeUnits.toFixed(1)}u
                    </div>
                  </div>
                </div>

                {/* Match Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Starts {formatDistanceToNow(parseISO(selectedPick.match.startTime), { addSuffix: true })}</span>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
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
