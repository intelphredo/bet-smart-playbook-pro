import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Match } from "@/types/sports";
import { useOddsHistory, OddsHistoryPoint } from "@/hooks/useOddsHistory";
import { format } from "date-fns";

interface OddsLineChartProps {
  match: Match;
  expanded?: boolean;
}

// Sportsbook colors for chart lines
const SPORTSBOOK_COLORS: Record<string, string> = {
  DraftKings: "#00694B",
  FanDuel: "#1493FF",
  BetMGM: "#C4A34C",
  Caesars: "#C41230",
  PointsBet: "#F15A22",
  Barstool: "#E31837",
  Bet365: "#027B5B",
  BetRivers: "#1C4587",
  Unibet: "#14805E",
  "William Hill": "#002F5F",
};

const OddsLineChart = ({ match, expanded: initialExpanded = false }: OddsLineChartProps) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [selectedBetType, setSelectedBetType] = useState<"home" | "away" | "draw">("home");
  const { chartData, hasHistory } = useOddsHistory(match);

  // Get unique sportsbooks
  const sportsbooks = useMemo(() => {
    return [...new Set(chartData.map(d => d.sportsbook))];
  }, [chartData]);

  // Transform data for Recharts - group by timestamp
  const transformedData = useMemo(() => {
    const groupedByTime: Record<string, Record<string, number>> = {};
    
    chartData.forEach((point: OddsHistoryPoint) => {
      const timeKey = point.timestamp;
      if (!groupedByTime[timeKey]) {
        groupedByTime[timeKey] = { timestamp: new Date(point.timestamp).getTime() } as any;
      }
      
      const value = selectedBetType === "home" 
        ? point.homeWin 
        : selectedBetType === "away" 
        ? point.awayWin 
        : point.draw || 0;
        
      groupedByTime[timeKey][point.sportsbook] = value;
    });
    
    return Object.values(groupedByTime).sort((a, b) => (a as any).timestamp - (b as any).timestamp);
  }, [chartData, selectedBetType]);

  // Calculate trend for each sportsbook
  const trends = useMemo(() => {
    const result: Record<string, { direction: "up" | "down" | "stable"; change: number }> = {};
    
    sportsbooks.forEach(sportsbook => {
      const sportsbookData = chartData.filter(d => d.sportsbook === sportsbook);
      if (sportsbookData.length >= 2) {
        const first = sportsbookData[0];
        const last = sportsbookData[sportsbookData.length - 1];
        const firstValue = selectedBetType === "home" ? first.homeWin : selectedBetType === "away" ? first.awayWin : first.draw || 0;
        const lastValue = selectedBetType === "home" ? last.homeWin : selectedBetType === "away" ? last.awayWin : last.draw || 0;
        const change = lastValue - firstValue;
        
        result[sportsbook] = {
          direction: change > 0.02 ? "up" : change < -0.02 ? "down" : "stable",
          change: Math.round(change * 100) / 100
        };
      }
    });
    
    return result;
  }, [chartData, sportsbooks, selectedBetType]);

  if (!hasHistory || !match.liveOdds || match.liveOdds.length === 0) {
    return null;
  }

  const hasDrawOdds = match.liveOdds.some(o => o.draw !== undefined);

  const formatOddsLabel = (value: number) => {
    if (value >= 2) return `+${Math.round((value - 1) * 100)}`;
    return `-${Math.round(100 / (value - 1))}`;
  };

  return (
    <Card className="mt-4 bg-card/50 border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Line Movement
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
        
        {/* Bet type selector */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={selectedBetType === "home" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBetType("home")}
            className="h-7 text-xs"
          >
            {match.homeTeam.shortName}
          </Button>
          <Button
            variant={selectedBetType === "away" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBetType("away")}
            className="h-7 text-xs"
          >
            {match.awayTeam.shortName}
          </Button>
          {hasDrawOdds && (
            <Button
              variant={selectedBetType === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBetType("draw")}
              className="h-7 text-xs"
            >
              Draw
            </Button>
          )}
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4 pt-2">
          {/* Trend badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {sportsbooks.map(sportsbook => {
              const trend = trends[sportsbook];
              if (!trend) return null;
              
              return (
                <Badge 
                  key={sportsbook}
                  variant="outline" 
                  className="text-xs gap-1"
                  style={{ borderColor: SPORTSBOOK_COLORS[sportsbook] || "#888" }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: SPORTSBOOK_COLORS[sportsbook] || "#888" }}
                  />
                  {sportsbook}
                  {trend.direction === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                  {trend.direction === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                  {trend.direction === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
                  <span className={
                    trend.change > 0 ? "text-green-500" : 
                    trend.change < 0 ? "text-red-500" : 
                    "text-muted-foreground"
                  }>
                    {trend.change > 0 ? "+" : ""}{trend.change.toFixed(2)}
                  </span>
                </Badge>
              );
            })}
          </div>

          {/* Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transformedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => format(new Date(value), "HH:mm")}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis 
                  domain={["auto", "auto"]}
                  tickFormatter={formatOddsLabel}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  width={45}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  labelFormatter={(value) => format(new Date(value), "MMM d, HH:mm")}
                  formatter={(value: number, name: string) => [formatOddsLabel(value), name]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "11px" }}
                  iconSize={8}
                />
                {sportsbooks.map((sportsbook) => (
                  <Line
                    key={sportsbook}
                    type="monotone"
                    dataKey={sportsbook}
                    name={sportsbook}
                    stroke={SPORTSBOOK_COLORS[sportsbook] || "#888"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Showing odds movement over the last 6 hours • Updates every minute
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default OddsLineChart;
