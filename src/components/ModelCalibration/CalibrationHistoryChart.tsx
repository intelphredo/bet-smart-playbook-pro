/**
 * Chart component showing calibration metrics over time
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { History, TrendingUp, TrendingDown, Minus, Activity, Target, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalibrationHistory, useCalibrationTrends, CalibrationHistoryRecord } from "@/hooks/useCalibrationHistory";
import { format } from "date-fns";

interface CalibrationHistoryChartProps {
  days?: number;
  className?: string;
}

export function CalibrationHistoryChart({ days = 30, className }: CalibrationHistoryChartProps) {
  const { data: history, isLoading } = useCalibrationHistory(days);
  const { trends } = useCalibrationTrends(days);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Calibration History
          </CardTitle>
          <CardDescription>
            Track how model accuracy improves over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No calibration history yet</p>
            <p className="text-xs">History will be recorded automatically as predictions are made</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for charts
  const chartData = history.map((record) => ({
    date: format(new Date(record.recorded_at), 'MMM d'),
    timestamp: record.recorded_at,
    healthScore: record.overall_health_score,
    brierScore: record.brier_score ? Math.round(record.brier_score * 1000) / 1000 : null,
    adjustedBins: record.adjusted_bins,
    calibrated: record.is_well_calibrated,
    overconfident: record.overconfident_bins,
    underconfident: record.underconfident_bins,
    adjustmentFactor: record.overall_adjustment_factor,
  }));

  const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const isNeutral = Math.abs(value) < 1;
    
    if (isNeutral) {
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Minus className="h-3 w-3" />
          Stable
        </Badge>
      );
    }
    
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "text-xs gap-1",
          isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
        )}
      >
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Calibration History
              <Badge variant="outline" className="ml-2 text-xs">
                {history.length} snapshots
              </Badge>
            </CardTitle>
            <CardDescription>
              Model accuracy trends over the last {days} days
            </CardDescription>
          </div>
          {trends && (
            <div className="flex items-center gap-2">
              {trends.isImproving ? (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Improving
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Needs Attention
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Summary Cards */}
        {trends && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Health Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{Math.round(trends.currentHealth)}</span>
                <TrendIndicator value={trends.healthTrend} />
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Brier Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{trends.currentBrier.toFixed(3)}</span>
                <TrendIndicator value={trends.brierTrend} />
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Adjusted Bins</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{Math.round(history[history.length - 1]?.adjusted_bins || 0)}</span>
                <TrendIndicator value={trends.adjustedBinsTrend} />
              </div>
            </div>
          </div>
        )}

        {/* Health Score Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Health Score Over Time</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}`, 'Health Score']}
                />
                <Area
                  type="monotone"
                  dataKey="healthScore"
                  stroke="hsl(var(--primary))"
                  fill="url(#healthGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calibration Issues Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Calibration Issues</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      overconfident: 'Overconfident Bins',
                      underconfident: 'Underconfident Bins',
                      adjustedBins: 'Adjusted Bins',
                    };
                    return labels[value] || value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="overconfident"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="underconfident"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="adjustedBins"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p className="font-medium mb-1">How Auto-Tuning Works</p>
          <p>
            The system automatically adjusts confidence scores based on historical performance. 
            As the model learns from past predictions, you should see the health score increase 
            and the number of calibration issues decrease over time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
