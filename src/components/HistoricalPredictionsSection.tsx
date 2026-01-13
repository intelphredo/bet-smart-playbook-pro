import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  RefreshCw,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { 
  useHistoricalPredictions, 
  HistoricalPrediction, 
  TimeRange, 
  PredictionType 
} from "@/hooks/useHistoricalPredictions";
import PredictionCharts from "./PredictionCharts";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { League } from "@/types/sports";

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
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");
  const [predictionType, setPredictionType] = useState<PredictionType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settledOnly, setSettledOnly] = useState(false);
  
  const { data, isLoading, error, refetch } = useHistoricalPredictions(timeRange, predictionType);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const { predictions, stats } = data || { predictions: [], stats: null };

  // Get unique leagues for filter
  const leagues = Array.from(new Set(predictions.map(p => p.league).filter(Boolean))) as string[];

  // Get unique teams for filter (from home_team and away_team)
  const teams = Array.from(new Set(
    predictions.flatMap(p => [p.home_team, p.away_team].filter(Boolean))
  )).sort() as string[];

  // Filter predictions
  const filteredPredictions = predictions.filter(p => {
    if (leagueFilter !== "all" && p.league !== leagueFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (settledOnly && p.status !== "won" && p.status !== "lost") return false;
    if (teamFilter !== "all") {
      const matchesTeam = p.home_team === teamFilter || p.away_team === teamFilter;
      if (!matchesTeam) return false;
    }
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

            {/* Team Filter */}
            <div className="sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Team</span>
              </div>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all" className="text-xs">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team} className="text-xs">
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Settled Only Toggle */}
            <div className="sm:w-auto flex items-end">
              <div className="flex items-center gap-2 h-8 px-3 rounded-md border bg-background">
                <Switch
                  id="settled-only"
                  checked={settledOnly}
                  onCheckedChange={setSettledOnly}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="settled-only" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <Filter className="h-3 w-3" />
                  Settled Only
                </Label>
              </div>
            </div>

            {/* Refresh & Export Buttons */}
            <div className="sm:w-auto flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2 h-8"
                disabled={isRefreshing || isLoading}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
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
          leagueDailyTrends={stats.leagueDailyTrends}
          overallWinRate={stats.winRate}
          totalPL={stats.totalPL}
          totalUnitsStaked={stats.totalUnitsStaked}
          roi={stats.roi}
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

      {/* Predictions List - Split by Pre-Live and Live */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pre-Live Predictions Column */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-500" />
                Pre-Live Predictions
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-500">
                  {filteredPredictions.filter(p => !p.is_live_prediction).length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                  <SelectTrigger className="w-[100px] h-7 text-xs">
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
                  <SelectTrigger className="w-[90px] h-7 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="divide-y divide-border">
                {filteredPredictions.filter(p => !p.is_live_prediction).length > 0 ? (
                  filteredPredictions
                    .filter(p => !p.is_live_prediction)
                    .map(prediction => (
                      <PredictionRow key={prediction.id} prediction={prediction} showTypeTag={false} />
                    ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No pre-live predictions</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Predictions Column */}
        <Card className="border-orange-500/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
                Live Predictions
                <Badge variant="secondary" className="ml-2 bg-orange-500/10 text-orange-500">
                  {filteredPredictions.filter(p => p.is_live_prediction).length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="divide-y divide-border">
                {filteredPredictions.filter(p => p.is_live_prediction).length > 0 ? (
                  filteredPredictions
                    .filter(p => p.is_live_prediction)
                    .map(prediction => (
                      <PredictionRow key={prediction.id} prediction={prediction} showTypeTag={false} />
                    ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No live predictions</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
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

const PredictionRow = ({ prediction, showTypeTag = true }: { prediction: HistoricalPrediction; showTypeTag?: boolean }) => {
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

  // Parse team names from match_title or prediction
  const getTeamNames = () => {
    if (prediction.home_team && prediction.away_team) {
      return { home: prediction.home_team, away: prediction.away_team };
    }
    // Fallback: try to parse from match_title (format: "Away @ Home")
    if (prediction.match_title) {
      const parts = prediction.match_title.split(' @ ');
      if (parts.length === 2) {
        return { away: parts[0], home: parts[1] };
      }
    }
    // Fallback: extract from prediction text
    if (prediction.prediction) {
      const teamName = prediction.prediction.replace(/ Win$| ML$| -[\d.]+$| \+[\d.]+$/i, '');
      return { home: teamName, away: 'vs' };
    }
    return { home: 'Home', away: 'Away' };
  };

  const teams = getTeamNames();
  const hasActualScores = prediction.actual_score_home !== null && prediction.actual_score_away !== null;
  const hasProjectedScores = prediction.projected_score_home !== null && prediction.projected_score_away !== null;
  
  // Get league for logo lookup
  const league = (prediction.league?.toUpperCase() || "NBA") as League;

  // Team Logo Component
  const TeamLogo = ({ teamName, size = "sm" }: { teamName: string; size?: "sm" | "md" }) => {
    const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
    return (
      <Avatar className={cn(sizeClass, "shrink-0")}>
        <AvatarImage 
          src={getTeamLogoUrl(teamName, league)} 
          alt={teamName}
          className="object-contain"
        />
        <AvatarFallback className="text-[8px] font-bold bg-muted">
          {getTeamInitials(teamName)}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
      {/* Status Icon */}
      <div className={cn("p-1.5 rounded-full shrink-0", status.bg)}>
        <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Match Title with Teams */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge variant="outline" className="text-[9px] shrink-0 px-1.5 py-0">
            {prediction.league || "Unknown"}
          </Badge>
        </div>

        {/* Team Matchup with Logos and Scores */}
        <div className="flex items-center gap-1.5 text-xs">
          <TeamLogo teamName={teams.away} />
          <span className="font-medium truncate max-w-[80px]">{teams.away}</span>
          {hasActualScores && (
            <span className={cn(
              "font-bold tabular-nums text-sm",
              prediction.actual_score_away! > prediction.actual_score_home! ? "text-green-500" : "text-muted-foreground"
            )}>
              {prediction.actual_score_away}
            </span>
          )}
          <span className="text-muted-foreground">@</span>
          <TeamLogo teamName={teams.home} />
          <span className="font-medium truncate max-w-[80px]">{teams.home}</span>
          {hasActualScores && (
            <span className={cn(
              "font-bold tabular-nums text-sm",
              prediction.actual_score_home! > prediction.actual_score_away! ? "text-green-500" : "text-muted-foreground"
            )}>
              {prediction.actual_score_home}
            </span>
          )}
        </div>

        {/* Prediction & Metadata */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          <span className="font-medium text-foreground/80">{prediction.prediction}</span>
          <span>•</span>
          <span>{format(new Date(prediction.predicted_at), "MMM d, HH:mm")}</span>
          {prediction.confidence && (
            <>
              <span>•</span>
              <span>{prediction.confidence}%</span>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <Badge variant="secondary" className={cn("shrink-0 text-[10px]", status.color, status.bg)}>
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
