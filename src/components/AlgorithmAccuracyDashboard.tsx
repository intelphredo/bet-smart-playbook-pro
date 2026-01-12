import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Layers,
  Award,
  Download,
  Upload,
  Loader2,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAlgorithmAccuracy, useRecentPredictions, AlgorithmAccuracyStats, AlgorithmPrediction } from '@/hooks/useAlgorithmAccuracy';
import { usePredictionSync } from '@/hooks/usePredictionSync';
import { ALGORITHM_IDS } from '@/utils/predictions/algorithms';
import { format, formatDistanceToNow } from 'date-fns';
import { PredictionCorrectionModal } from './PredictionCorrectionModal';
import { BulkCorrectionModal } from './BulkCorrectionModal';

const chartConfig = {
  wins: { label: 'Wins', color: 'hsl(142.1 76.2% 36.3%)' },
  losses: { label: 'Losses', color: 'hsl(0 84.2% 60.2%)' },
  winRate: { label: 'Win Rate', color: 'hsl(var(--primary))' },
};

const ALGORITHM_OPTIONS = [
  { label: 'All Algorithms', value: 'all' },
  { label: 'ML Power Index', value: ALGORITHM_IDS.ML_POWER_INDEX },
  { label: 'Value Pick Finder', value: ALGORITHM_IDS.VALUE_PICK_FINDER },
  { label: 'Statistical Edge', value: ALGORITHM_IDS.STATISTICAL_EDGE },
];

const TIME_RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

function ResultBadge({ status }: { status: 'pending' | 'won' | 'lost' }) {
  switch (status) {
    case 'won':
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Won</Badge>;
    case 'lost':
      return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Lost</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
  }
}

function AlgorithmCard({ stats }: { stats: AlgorithmAccuracyStats }) {
  const winRateColor = stats.winRate >= 60 ? 'text-green-500' : stats.winRate >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{stats.algorithmName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {stats.totalPredictions} picks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Win Rate</span>
            <span className={`text-lg font-bold ${winRateColor}`}>
              {stats.winRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={stats.winRate} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/50 p-2 rounded">
            <p className="text-muted-foreground text-xs">Correct</p>
            <p className="font-bold text-green-500">{stats.correctPredictions}</p>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <p className="text-muted-foreground text-xs">Wrong</p>
            <p className="font-bold text-red-500">{stats.totalPredictions - stats.correctPredictions}</p>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <p className="text-muted-foreground text-xs">Avg Confidence</p>
            <p className="font-bold">{stats.avgConfidence.toFixed(0)}%</p>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <p className="text-muted-foreground text-xs">Accuracy Score</p>
            <p className="font-bold">{stats.avgAccuracyRating.toFixed(0)}</p>
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Recent Results</p>
          <div className="flex gap-1">
            {stats.recentResults.length > 0 ? (
              stats.recentResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    result === 'W' 
                      ? 'bg-green-500/20 text-green-600' 
                      : 'bg-red-500/20 text-red-600'
                  }`}
                >
                  {result}
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No recent results</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionRow({ 
  prediction, 
  onEdit 
}: { 
  prediction: AlgorithmPrediction; 
  onEdit: (prediction: AlgorithmPrediction) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {prediction.league}
          </Badge>
          <ResultBadge status={prediction.status} />
        </div>
        <p className="font-medium text-sm truncate">{prediction.prediction}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(prediction.predictedAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 mb-1">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{prediction.confidence}%</span>
          </div>
          {prediction.projectedScoreHome !== null && prediction.projectedScoreAway !== null && (
            <p className="text-xs text-muted-foreground">
              Proj: {prediction.projectedScoreHome}-{prediction.projectedScoreAway}
            </p>
          )}
          {prediction.actualScoreHome !== null && prediction.actualScoreAway !== null && (
            <p className="text-xs font-medium">
              Actual: {prediction.actualScoreHome}-{prediction.actualScoreAway}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(prediction)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AlgorithmAccuracyDashboard() {
  const [days, setDays] = useState(30);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('all');
  const [editingPrediction, setEditingPrediction] = useState<AlgorithmPrediction | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [bulkCorrectionOpen, setBulkCorrectionOpen] = useState(false);

  const algorithmId = selectedAlgorithm === 'all' ? undefined : selectedAlgorithm;

  const { 
    data: accuracyStats, 
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useAlgorithmAccuracy({ days, algorithmId });

  const {
    data: recentPredictions,
    isLoading: isLoadingPredictions,
  } = useRecentPredictions({ limit: 20, algorithmId });

  const {
    savePredictions,
    gradePredictions,
    syncAll,
    isSaving,
    isGrading,
  } = usePredictionSync();

  const isLoading = isLoadingStats || isLoadingPredictions;

  const handleSync = async () => {
    await syncAll();
    refetchStats();
  };

  // Aggregate stats for overview
  const aggregateStats = accuracyStats?.reduce(
    (acc, stats) => ({
      total: acc.total + stats.totalPredictions,
      wins: acc.wins + stats.correctPredictions,
      avgConfidence: acc.avgConfidence + stats.avgConfidence * stats.totalPredictions,
    }),
    { total: 0, wins: 0, avgConfidence: 0 }
  );

  const overallWinRate = aggregateStats && aggregateStats.total > 0
    ? (aggregateStats.wins / aggregateStats.total) * 100
    : 0;

  const overallConfidence = aggregateStats && aggregateStats.total > 0
    ? aggregateStats.avgConfidence / aggregateStats.total
    : 0;

  // Get combined trend data
  const trendData = accuracyStats?.[0]?.trend || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Algorithm Accuracy Tracking
          </h2>
          <p className="text-sm text-muted-foreground">
            Compare predictions to actual game results
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={String(range.value)}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALGORITHM_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={() => setBulkCorrectionOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Bulk Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={handleSync}
            disabled={isSaving || isGrading}
          >
            {isSaving || isGrading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Sync
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{aggregateStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{aggregateStats?.wins || 0}</p>
                <p className="text-xs text-muted-foreground">Correct Predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className={`text-2xl font-bold ${overallWinRate >= 55 ? 'text-green-500' : overallWinRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {overallWinRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Overall Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{overallConfidence.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Daily Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="wins" fill="hsl(142.1 76.2% 36.3%)" stackId="results" />
                  <Bar dataKey="losses" fill="hsl(0 84.2% 60.2%)" stackId="results" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Algorithm Cards */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Algorithm Performance
          </h3>
          {accuracyStats && accuracyStats.length > 0 ? (
            <div className="space-y-4">
              {accuracyStats.map((stats) => (
                <AlgorithmCard key={stats.algorithmId} stats={stats} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No algorithm data available for this period
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Predictions */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Predictions
          </h3>
          <Card>
            <CardContent className="p-4">
              {recentPredictions && recentPredictions.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentPredictions.map((prediction) => (
                    <PredictionRow 
                      key={prediction.id} 
                      prediction={prediction} 
                      onEdit={(p) => {
                        setEditingPrediction(p);
                        setCorrectionModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No recent predictions found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confidence Range Breakdown */}
      {accuracyStats && accuracyStats.length > 0 && accuracyStats[0].byConfidenceRange.some(r => r.total > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Win Rate by Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {accuracyStats[0].byConfidenceRange.map((range) => (
                <div key={range.range} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">{range.range}</p>
                  <p className={`text-xl font-bold ${range.winRate >= 55 ? 'text-green-500' : range.winRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {range.total > 0 ? `${range.winRate.toFixed(0)}%` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {range.wins}/{range.total} correct
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* League Breakdown */}
      {accuracyStats && accuracyStats.length > 0 && accuracyStats[0].byLeague.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance by League</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accuracyStats[0].byLeague.map((league) => (
                <div key={league.league} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{league.league}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {league.wins}/{league.total} correct
                    </span>
                  </div>
                  <span className={`font-bold ${league.winRate >= 55 ? 'text-green-500' : league.winRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {league.winRate.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Correction Modal */}
      <PredictionCorrectionModal
        prediction={editingPrediction}
        open={correctionModalOpen}
        onOpenChange={setCorrectionModalOpen}
      />

      {/* Bulk Correction Modal */}
      <BulkCorrectionModal
        open={bulkCorrectionOpen}
        onOpenChange={setBulkCorrectionOpen}
      />
    </div>
  );
}
