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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Shield,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useHistoricalPredictions, TimeRange, PredictionType } from "@/hooks/useHistoricalPredictions";
import PredictionCharts from "@/components/PredictionCharts";
import { InfoExplainer } from "@/components/ui/InfoExplainer";
import { getTeamLogoUrl, getTeamInitials, getLeagueLogoUrl, getLeagueDisplayName } from "@/utils/teamLogos";
import { League } from "@/types/sports";
import { ContextLedger, CalibrationChart, LossPostMortem } from "@/components/AIHistory";
import { PredictionDisclaimer } from "@/components/legal";
import { 
  GroupedLeagueSelect, 
  LEAGUE_CATEGORIES, 
  groupLeaguesByCategory 
} from "@/components/filters/GroupedLeagueSelect";
import { ALGORITHM_REGISTRY } from "@/domain/prediction/algorithms";

// Helper to get algorithm name from ID
const getAlgorithmName = (algorithmId: string | null): string => {
  if (!algorithmId) return 'Unknown';
  const algo = ALGORITHM_REGISTRY.find(a => a.id === algorithmId);
  return algo?.name || 'Unknown';
};

// Get algorithm description for tooltips
const getAlgorithmDescription = (algorithmId: string | null): string => {
  if (!algorithmId) return '';
  const algo = ALGORITHM_REGISTRY.find(a => a.id === algorithmId);
  return algo?.description || '';
};

// Get short algorithm name for badges
const getAlgorithmShortName = (algorithmId: string | null): string => {
  const name = getAlgorithmName(algorithmId);
  const shortNames: Record<string, string> = {
    'ML Power Index': 'ML Power',
    'Value Pick Finder': 'Value Pick',
    'Statistical Edge': 'Stat Edge',
    'Sharp Money': 'Sharp',
    'AI Debate Moderator': 'AI Debate',
  };
  return shortNames[name] || name;
};

// League icon component with fallback
function LeagueIcon({ league, size = 16 }: { league: string; size?: number }) {
  const logoUrl = getLeagueLogoUrl(league);
  
  return (
    <img 
      src={logoUrl} 
      alt={league}
      className="rounded-sm object-contain"
      style={{ width: size, height: size }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

const TIME_RANGE_TABS: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "1m", label: "30D" },
  { value: "all", label: "All Time" },
];

export default function AIPredictions() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [predictionType, setPredictionType] = useState<PredictionType>("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [algorithmFilter, setAlgorithmFilter] = useState<string>("all");
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
    if (algorithmFilter !== "all" && p.algorithm_id !== algorithmFilter) return false;
    return true;
  });

  // Compute filtered stats for display when league filter is active
  const PAYOUT_FACTOR = 0.9091;
  const displayStats = (() => {
    if (!stats) return null;
    if (leagueFilter === "all") return stats;
    const fp = filteredPredictions;
    const won = fp.filter(p => p.status === "won").length;
    const lost = fp.filter(p => p.status === "lost").length;
    const pending = fp.filter(p => p.status === "pending").length;
    const settled = won + lost;
    const winRate = settled > 0 ? (won / settled) * 100 : 0;
    const totalPL = (won * PAYOUT_FACTOR) - lost;
    const roi = settled > 0 ? (totalPL / settled) * 100 : 0;
    const confidences = fp.filter(p => p.confidence).map(p => p.confidence!);
    const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
    return { ...stats, total: fp.length, won, lost, pending, settled, winRate, totalPL, roi, avgConfidence, totalUnitsStaked: settled };
  })();

  // Split by type
  const preLivePredictions = filteredPredictions.filter(p => !p.is_live_prediction);
  const livePredictions = filteredPredictions.filter(p => p.is_live_prediction);

  // Time range label for header
  const timeLabel = TIME_RANGE_TABS.find(t => t.value === timeRange)?.label || "All Time";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      
      <main id="main-content" className="flex-1 container px-4 py-6 mx-auto space-y-6">
        {/* Prediction Disclaimer */}
        <PredictionDisclaimer className="mb-2" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                {leagueFilter !== "all" 
                  ? `${getLeagueDisplayName(leagueFilter)} Predictions`
                  : "AI Prediction History"}
                <InfoExplainer term="confidence" />
              </h1>
              {leagueFilter !== "all" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs gap-1"
                  onClick={() => setLeagueFilter("all")}
                >
                  <XCircle className="h-3 w-3" />
                  Show All Leagues
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {leagueFilter !== "all" 
                ? `${getLeagueDisplayName(leagueFilter)} • ${timeLabel}`
                : "Track all AI model predictions and their outcomes"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/50 rounded-lg border border-border/30 p-0.5 gap-0.5">
              {TIME_RANGE_TABS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    timeRange === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
        {displayStats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <StatCard
                title="Total"
                value={displayStats.total.toString()}
                icon={Brain}
                isLoading={isLoading}
              />
              <StatCard
                title="Settled"
                value={`${displayStats.settled}`}
                icon={Target}
                isLoading={isLoading}
              />
              <StatCard
                title="Win Rate"
                value={displayStats.settled > 0 ? `${displayStats.winRate.toFixed(1)}%` : 'N/A'}
                icon={displayStats.winRate >= displayStats.breakEvenWinRate ? TrendingUp : TrendingDown}
                trend={displayStats.settled > 0 ? (displayStats.winRate >= displayStats.breakEvenWinRate ? "up" : "down") : undefined}
                isLoading={isLoading}
              />
              <StatCard
                title="Record"
                value={`${displayStats.won}W - ${displayStats.lost}L`}
                icon={Trophy}
                isLoading={isLoading}
              />
              <StatCard
                title="P/L (Units)"
                value={`${displayStats.totalPL >= 0 ? '+' : ''}${displayStats.totalPL.toFixed(2)}u`}
                icon={displayStats.totalPL >= 0 ? TrendingUp : TrendingDown}
                trend={displayStats.totalPL >= 0 ? "up" : "down"}
                isLoading={isLoading}
              />
              <StatCard
                title="ROI"
                value={displayStats.settled > 0 ? `${displayStats.roi >= 0 ? '+' : ''}${displayStats.roi.toFixed(1)}%` : 'N/A'}
                icon={BarChart3}
                trend={displayStats.roi >= 0 ? "up" : "down"}
                isLoading={isLoading}
              />
            </div>

            {/* Data Validation Banner */}
            {displayStats.pending > 0 && displayStats.settled === 0 && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
                    <span className="text-muted-foreground">
                      All <span className="font-medium text-foreground">{displayStats.pending}</span> predictions are still pending. 
                      Win rate and P/L will update once games settle.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Break-Even Analysis */}
            {displayStats.settled >= 10 && (
              <Card className="border-muted">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Break-even at -110 odds:</span>
                      <span className="font-medium">{displayStats.breakEvenWinRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">You:</span>
                      <span className={cn(
                        "font-bold",
                        displayStats.winRate >= displayStats.breakEvenWinRate ? "text-green-500" : "text-red-500"
                      )}>
                        {displayStats.winRate.toFixed(1)}% 
                        ({displayStats.winRate >= displayStats.breakEvenWinRate ? '+' : ''}{(displayStats.winRate - displayStats.breakEvenWinRate).toFixed(1)}%)
                      </span>
                    </div>
                    {displayStats.winRate < displayStats.breakEvenWinRate && displayStats.lost > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        Need {Math.ceil((displayStats.breakEvenWinRate / 100) * displayStats.settled) - displayStats.won} more wins to break even
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Performance by League
                  </CardTitle>
                  {leagueFilter !== "all" && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setLeagueFilter("all")}>
                      Clear Filter
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.leaguePerformance.slice(0, 6).map(league => (
                      <button
                        key={league.league}
                        onClick={() => setLeagueFilter(leagueFilter === league.league ? "all" : league.league)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left w-full",
                          leagueFilter === league.league
                            ? "bg-primary/10 border-2 border-primary ring-1 ring-primary/20"
                            : "bg-muted/50 border-2 border-transparent hover:bg-muted hover:border-border/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shadow-sm">
                            <LeagueIcon league={league.league} size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{getLeagueDisplayName(league.league)}</p>
                            <p className="text-xs text-muted-foreground">
                              {league.won}W - {league.lost}L
                            </p>
                          </div>
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
                      </button>
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
              <div className="flex flex-wrap gap-2">
                <GroupedLeagueSelect
                  value={leagueFilter}
                  onValueChange={setLeagueFilter}
                  leagues={leagues}
                  allLabel="All Leagues"
                  className="w-[160px]"
                />
                <Select value={algorithmFilter} onValueChange={setAlgorithmFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Algorithms</SelectItem>
                    {ALGORITHM_REGISTRY.map(algo => (
                      <SelectItem key={algo.id} value={algo.id}>
                        {algo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={predictionType} onValueChange={(v) => setPredictionType(v as PredictionType)}>
                  <SelectTrigger className="w-[110px]">
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
  const isDebate = prediction.algorithm_id === 'ai-debate-moderator';

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

  const agreementColors: Record<string, string> = {
    unanimous: 'bg-green-500/10 text-green-500 border-green-500/20',
    strong: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    split: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    contested: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left - Teams & Match */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <StatusIcon className={cn("h-5 w-5 shrink-0", statusColor)} />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{matchTitle}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <LeagueIcon league={prediction.league || 'NBA'} size={14} />
                <span>{getLeagueDisplayName(prediction.league) || 'Unknown'}</span>
                <span>•</span>
                <span>{format(new Date(prediction.predicted_at), 'MMM d, h:mm a')}</span>
                {prediction.algorithm_id && (
                  <>
                    <span>•</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className={cn(
                          "text-xs py-0 px-1.5 border-0 cursor-help",
                          isDebate ? "bg-purple-500/10 text-purple-400" : "bg-primary/10 text-primary"
                        )}>
                          {isDebate && <Sparkles className="h-3 w-3 mr-0.5 inline" />}
                          {getAlgorithmShortName(prediction.algorithm_id)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">{getAlgorithmName(prediction.algorithm_id)}</p>
                        <p className="text-xs text-muted-foreground">{getAlgorithmDescription(prediction.algorithm_id)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
                {isDebate && prediction.agreement_level && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className={cn("text-xs py-0 px-1.5", agreementColors[prediction.agreement_level])}>
                      {prediction.agreement_level}
                    </Badge>
                  </>
                )}
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

        {/* Debate-specific expanded details */}
        {isDebate && (prediction.debate_reasoning || prediction.risk_flag || prediction.biases_identified) && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
            {prediction.debate_reasoning && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-purple-400" />
                <span className="line-clamp-2">{prediction.debate_reasoning}</span>
              </div>
            )}
            {prediction.key_factor && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 mt-0.5 shrink-0 text-yellow-500" />
                <span><span className="font-medium text-foreground">Key:</span> {prediction.key_factor}</span>
              </div>
            )}
            {prediction.temporal_insight && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mt-0.5 shrink-0 text-blue-400" />
                <span>{prediction.temporal_insight}</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {prediction.risk_flag && (
                <Badge variant="outline" className="text-xs py-0 bg-red-500/10 text-red-400 border-red-500/20">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {prediction.risk_flag}
                </Badge>
              )}
              {Array.isArray(prediction.biases_identified) && prediction.biases_identified.map((bias: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs py-0 bg-orange-500/10 text-orange-400 border-orange-500/20">
                  <Shield className="h-3 w-3 mr-0.5" />
                  {bias}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
