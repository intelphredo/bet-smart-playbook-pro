import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Target, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Sparkles,
  RefreshCw,
  Loader2,
  Calendar,
  Trophy,
  Zap,
  Lightbulb,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useHistoricalPredictions, TimeRange, PredictionType } from "@/hooks/useHistoricalPredictions";
import PredictionCharts from "@/components/PredictionCharts";
import { InfoExplainer } from "@/components/ui/InfoExplainer";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { League } from "@/types/sports";
import { ContextLedger, CalibrationChart, LossPostMortem } from "@/components/AIHistory";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "24 Hours" },
  { value: "7d", label: "1 Week" },
  { value: "14d", label: "2 Weeks" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "all", label: "All Time" },
];

export default function AIPredictions() {
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");
  const [predictionType, setPredictionType] = useState<PredictionType>("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useHistoricalPredictions(timeRange, predictionType);
  const { predictions, stats } = data || { predictions: [], stats: null };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Get unique leagues
  const leagues = Array.from(new Set(predictions.map(p => p.league).filter(Boolean))) as string[];

  // Filter predictions
  const filteredPredictions = predictions.filter(p => {
    if (leagueFilter !== "all" && p.league !== leagueFilter) return false;
    return true;
  });

  // Split by type
  const preLivePredictions = filteredPredictions.filter(p => !p.is_live_prediction);
  const livePredictions = filteredPredictions.filter(p => p.is_live_prediction);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      
      <main id="main-content" className="flex-1 container px-4 py-6 mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI Prediction History
              <InfoExplainer term="confidence" />
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track all AI model predictions and their outcomes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title="Total Predictions"
              value={predictions.length.toString()}
              icon={Brain}
              isLoading={isLoading}
            />
            <StatCard
              title="Win Rate"
              value={`${stats.winRate.toFixed(1)}%`}
              icon={Target}
              trend={stats.winRate >= 50 ? "up" : "down"}
              isLoading={isLoading}
            />
            <StatCard
              title="Record"
              value={`${stats.won}W - ${stats.lost}L`}
              icon={Trophy}
              isLoading={isLoading}
            />
            <StatCard
              title="Profit/Loss"
              value={`${stats.totalPL >= 0 ? '+' : ''}$${stats.totalPL.toFixed(0)}`}
              icon={stats.totalPL >= 0 ? TrendingUp : TrendingDown}
              trend={stats.totalPL >= 0 ? "up" : "down"}
              isLoading={isLoading}
            />
            <StatCard
              title="ROI"
              value={`${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`}
              icon={BarChart3}
              trend={stats.roi >= 0 ? "up" : "down"}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="ledger" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Context Ledger</span>
              <span className="sm:hidden">Ledger</span>
            </TabsTrigger>
            <TabsTrigger value="calibration" className="gap-1.5">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Calibration</span>
              <span className="sm:hidden">Calib</span>
            </TabsTrigger>
            <TabsTrigger value="losses" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Learn from Losses</span>
              <span className="sm:hidden">Losses</span>
              {predictions.filter(p => p.status === 'lost').length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">
                  {predictions.filter(p => p.status === 'lost').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Charts */}
            {stats && (
              <PredictionCharts 
                dailyStats={stats.dailyStats}
                leaguePerformance={stats.leaguePerformance}
                confidenceVsAccuracy={stats.confidenceVsAccuracy}
                leagueDailyTrends={stats.leagueDailyTrends}
                overallWinRate={stats.winRate}
                totalPL={stats.totalPL}
                totalUnitsStaked={stats.totalUnitsStaked}
                roi={stats.roi}
              />
            )}

            {/* League Performance */}
            {stats?.leaguePerformance && stats.leaguePerformance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Performance by League
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.leaguePerformance.slice(0, 6).map(league => (
                      <div 
                        key={league.league}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{league.league}</p>
                          <p className="text-xs text-muted-foreground">
                            {league.won}W - {league.lost}L
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            league.winRate >= 55 && "text-green-500",
                            league.winRate < 45 && "text-red-500"
                          )}>
                            {league.winRate.toFixed(1)}%
                          </p>
                          <Progress 
                            value={league.winRate} 
                            className="w-16 h-1.5 mt-1" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Full Context Ledger Tab */}
          <TabsContent value="ledger" className="space-y-4">
            <ContextLedger 
              predictions={filteredPredictions} 
              isLoading={isLoading} 
            />
          </TabsContent>

          {/* Model Calibration Tab */}
          <TabsContent value="calibration" className="space-y-4">
            <CalibrationChart 
              predictions={predictions}
              confidenceVsAccuracy={stats?.confidenceVsAccuracy || []}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Learn from Losses Tab */}
          <TabsContent value="losses" className="space-y-4">
            <LossPostMortem 
              predictions={predictions} 
              isLoading={isLoading} 
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPredictions.length} predictions
              </p>
              <div className="flex gap-2">
                <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Leagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {leagues.map(league => (
                      <SelectItem key={league} value={league}>{league}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={predictionType} onValueChange={(v) => setPredictionType(v as PredictionType)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="prelive">Pre-Live</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <PredictionList 
              predictions={filteredPredictions.slice(0, 100)} 
              isLoading={isLoading} 
              showType
            />
          </TabsContent>
        </Tabs>
      </main>

      <PageFooter />
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  isLoading 
}: { 
  title: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string }>; 
  trend?: "up" | "down";
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-7 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className={cn(
          "text-lg font-bold",
          trend === "up" && "text-green-500",
          trend === "down" && "text-red-500"
        )}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function PredictionList({ 
  predictions, 
  isLoading,
  showType = false
}: { 
  predictions: any[]; 
  isLoading?: boolean;
  showType?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No predictions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {predictions.map((prediction) => (
          <PredictionRow 
            key={prediction.id} 
            prediction={prediction} 
            showType={showType}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function PredictionRow({ prediction, showType }: { prediction: any; showType?: boolean }) {
  const homeTeam = prediction.home_team || 'Home';
  const awayTeam = prediction.away_team || 'Away';
  const matchTitle = prediction.match_title || `${homeTeam} vs ${awayTeam}`;

  const StatusIcon = prediction.status === 'won' 
    ? CheckCircle2 
    : prediction.status === 'lost' 
    ? XCircle 
    : Clock;

  const statusColor = prediction.status === 'won' 
    ? 'text-green-500' 
    : prediction.status === 'lost' 
    ? 'text-red-500' 
    : 'text-yellow-500';

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left - Teams & Match */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <StatusIcon className={cn("h-5 w-5 shrink-0", statusColor)} />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{matchTitle}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{prediction.league || 'Unknown'}</span>
                <span>•</span>
                <span>{format(new Date(prediction.predicted_at), 'MMM d, h:mm a')}</span>
                {showType && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs py-0">
                      {prediction.is_live_prediction ? 'Live' : 'Pre-Live'}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right - Prediction & Score */}
          <div className="text-right shrink-0">
            <p className="text-sm font-medium">{prediction.prediction || '-'}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {prediction.confidence}% conf
              </span>
              {prediction.actual_score_home !== null && (
                <Badge variant="secondary" className="text-xs">
                  {prediction.actual_score_home} - {prediction.actual_score_away}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
