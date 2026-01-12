import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Trophy,
  AlertCircle,
  Zap,
  Calendar,
  Radio,
  PlayCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { 
  useHistoricalPredictions, 
  HistoricalPrediction, 
  TimeRange, 
  PredictionType 
} from "@/hooks/useHistoricalPredictions";
import PredictionCharts from "./PredictionCharts";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "24 Hours" },
  { value: "7d", label: "1 Week" },
  { value: "14d", label: "2 Weeks" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "all", label: "All Time" },
];

const HistoricalPredictionsSection = () => {
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");
  const [predictionType, setPredictionType] = useState<PredictionType>("all");
  
  const { data, isLoading, error } = useHistoricalPredictions(timeRange, predictionType);

  const { predictions, stats } = data || { predictions: [], stats: null };

  // Get unique leagues for filter
  const leagues = Array.from(new Set(predictions.map(p => p.league).filter(Boolean))) as string[];

  // Filter predictions
  const filteredPredictions = predictions.filter(p => {
    if (leagueFilter !== "all" && p.league !== leagueFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  // CSV Export function
  const exportToCSV = () => {
    if (!filteredPredictions.length) {
      toast.error("No predictions to export");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "League",
      "Match ID",
      "Prediction",
      "Confidence (%)",
      "Status",
      "Type",
      "Projected Home",
      "Projected Away",
      "Actual Home",
      "Actual Away",
      "Accuracy Rating"
    ];

    const rows = filteredPredictions.map(p => [
      format(new Date(p.predicted_at), "yyyy-MM-dd"),
      format(new Date(p.predicted_at), "HH:mm:ss"),
      p.league || "Unknown",
      p.match_id,
      p.prediction || "",
      p.confidence?.toString() || "",
      p.status,
      p.is_live_prediction ? "Live" : "Pre-Live",
      p.projected_score_home?.toString() || "",
      p.projected_score_away?.toString() || "",
      p.actual_score_home?.toString() || "",
      p.actual_score_away?.toString() || "",
      p.accuracy_rating?.toString() || ""
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `predictions_${timeRange}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredPredictions.length} predictions to CSV`);
  };

  if (isLoading) {
    return <HistoricalPredictionsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
          <p className="text-muted-foreground">Failed to load prediction history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range & Type Filters */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Time Range</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIME_RANGE_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    variant={timeRange === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(option.value)}
                    className={cn(
                      "text-xs h-8",
                      timeRange === option.value && "bg-primary text-primary-foreground"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prediction Type Selector */}
            <div className="sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Prediction Type</span>
              </div>
              <Tabs value={predictionType} onValueChange={(v) => setPredictionType(v as PredictionType)}>
                <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                  <TabsTrigger value="all" className="text-xs gap-1.5">
                    <BarChart3 className="h-3 w-3" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="prelive" className="text-xs gap-1.5">
                    <PlayCircle className="h-3 w-3" />
                    Pre-Live
                  </TabsTrigger>
                  <TabsTrigger value="live" className="text-xs gap-1.5">
                    <Radio className="h-3 w-3" />
                    Live
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Export Button */}
            <div className="sm:w-auto flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2 h-8"
                disabled={!predictions.length}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live vs Pre-Live Stats Comparison */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-500" />
                Pre-Live Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.preliveStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.preliveStats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    <span className="text-green-500">{stats.preliveStats.won}W</span>
                    {" - "}
                    <span className="text-red-500">{stats.preliveStats.lost}L</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Record</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
                Live Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.liveStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.liveStats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    <span className="text-green-500">{stats.liveStats.won}W</span>
                    {" - "}
                    <span className="text-red-500">{stats.liveStats.lost}L</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Record</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Predictions"
            value={stats.total}
            icon={Target}
            color="text-primary"
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            icon={stats.winRate >= 50 ? TrendingUp : TrendingDown}
            color={stats.winRate >= 50 ? "text-green-500" : "text-red-500"}
            subtitle={`${stats.won}W - ${stats.lost}L`}
          />
          <StatCard
            label="Avg Confidence"
            value={`${stats.avgConfidence.toFixed(0)}%`}
            icon={BarChart3}
            color="text-blue-500"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-yellow-500"
          />
        </div>
      )}

      {/* Charts Section */}
      {stats && stats.dailyStats.length > 0 && (
        <PredictionCharts
          dailyStats={stats.dailyStats}
          leaguePerformance={stats.leaguePerformance}
          confidenceVsAccuracy={stats.confidenceVsAccuracy}
          overallWinRate={stats.winRate}
        />
      )}

      {/* League Breakdown */}
      {stats && Object.keys(stats.byLeague).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Performance by League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.byLeague).map(([league, leagueStats]) => {
                const total = leagueStats.won + leagueStats.lost;
                const winRate = total > 0 ? (leagueStats.won / total) * 100 : 0;
                return (
                  <div
                    key={league}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{league}</Badge>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          winRate >= 50 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {winRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={winRate} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {leagueStats.won}W - {leagueStats.lost}L
                      {leagueStats.pending > 0 && ` (${leagueStats.pending} pending)`}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Prediction History
              <Badge variant="secondary" className="ml-2">
                {filteredPredictions.length} results
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="League" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {leagues.map(league => (
                    <SelectItem key={league} value={league}>
                      {league}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {filteredPredictions.length > 0 ? (
                filteredPredictions.map(prediction => (
                  <PredictionRow key={prediction.id} prediction={prediction} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No predictions match your filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) => (
  <Card className="bg-card/80">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("p-1.5 rounded-lg bg-muted", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

const PredictionRow = ({ prediction }: { prediction: HistoricalPrediction }) => {
  const statusConfig = {
    won: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      label: "Won",
    },
    lost: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      label: "Lost",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      label: "Pending",
    },
  };

  const status = statusConfig[prediction.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
      {/* Status Icon */}
      <div className={cn("p-2 rounded-full", status.bg)}>
        <StatusIcon className={cn("h-5 w-5", status.color)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {prediction.league || "Unknown"}
          </Badge>
          {prediction.is_live_prediction ? (
            <Badge variant="secondary" className="text-[10px] bg-orange-500/20 text-orange-500 border-orange-500/30">
              <Radio className="h-2.5 w-2.5 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-500 border-green-500/30">
              <PlayCircle className="h-2.5 w-2.5 mr-1" />
              Pre-Live
            </Badge>
          )}
          <span className="text-sm font-medium truncate">{prediction.prediction}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{format(new Date(prediction.predicted_at), "MMM d, yyyy HH:mm")}</span>
          {prediction.confidence && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {prediction.confidence}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Scores if available */}
      {(prediction.actual_score_home !== null || prediction.projected_score_home !== null) && (
        <div className="text-right text-sm">
          {prediction.actual_score_home !== null && prediction.actual_score_away !== null ? (
            <div>
              <p className="font-semibold">
                {prediction.actual_score_away} - {prediction.actual_score_home}
              </p>
              <p className="text-xs text-muted-foreground">Final</p>
            </div>
          ) : prediction.projected_score_home !== null && prediction.projected_score_away !== null ? (
            <div>
              <p className="text-muted-foreground">
                {prediction.projected_score_away} - {prediction.projected_score_home}
              </p>
              <p className="text-xs text-muted-foreground">Projected</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Status Badge */}
      <Badge variant="secondary" className={cn("shrink-0", status.color, status.bg)}>
        {status.label}
      </Badge>
    </div>
  );
};

const HistoricalPredictionsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardContent className="p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default HistoricalPredictionsSection;
