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
  Filter,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { useHistoricalPredictions, HistoricalPrediction } from "@/hooks/useHistoricalPredictions";

const HistoricalPredictionsSection = () => {
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, error } = useHistoricalPredictions(100);

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

  const { predictions, stats } = data || { predictions: [], stats: null };

  // Get unique leagues for filter
  const leagues = Array.from(new Set(predictions.map(p => p.league).filter(Boolean))) as string[];

  // Filter predictions
  const filteredPredictions = predictions.filter(p => {
    if (leagueFilter !== "all" && p.league !== leagueFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px]">
            {prediction.league || "Unknown"}
          </Badge>
          <span className="text-sm font-medium truncate">{prediction.prediction}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{format(new Date(prediction.predicted_at), "MMM d, yyyy")}</span>
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
