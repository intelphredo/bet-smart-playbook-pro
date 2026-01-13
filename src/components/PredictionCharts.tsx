import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, DollarSign } from "lucide-react";
import { DailyStats, LeaguePerformance, LeagueDailyStats } from "@/hooks/useHistoricalPredictions";

interface PredictionChartsProps {
  dailyStats: DailyStats[];
  leaguePerformance: LeaguePerformance[];
  confidenceVsAccuracy: { confidence: number; winRate: number; count: number }[];
  leagueDailyTrends: LeagueDailyStats[];
  overallWinRate: number;
}

const COLORS = {
  won: "hsl(142, 76%, 36%)",
  lost: "hsl(0, 84%, 60%)",
  pending: "hsl(45, 93%, 47%)",
  primary: "hsl(221, 83%, 53%)",
  secondary: "hsl(215, 20%, 65%)",
};

const LEAGUE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(0, 84%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 65%, 60%)",
  "hsl(180, 65%, 45%)",
];

const PredictionCharts = ({
  dailyStats,
  leaguePerformance,
  confidenceVsAccuracy,
  leagueDailyTrends,
  overallWinRate,
}: PredictionChartsProps) => {
  // Get league names from leaguePerformance for the trends chart
  const topLeagues = leaguePerformance.slice(0, 6).map(l => l.league);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Prediction Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="trend" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">Win Rate</span>
              <span className="sm:hidden">Trend</span>
            </TabsTrigger>
            <TabsTrigger value="pl" className="text-xs gap-1">
              <DollarSign className="h-3 w-3" />
              <span className="hidden sm:inline">P/L</span>
              <span className="sm:hidden">P/L</span>
            </TabsTrigger>
            <TabsTrigger value="league-trends" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              <span className="hidden sm:inline">Leagues</span>
              <span className="sm:hidden">Leagues</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Daily</span>
              <span className="sm:hidden">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="league" className="text-xs gap-1">
              <PieChartIcon className="h-3 w-3" />
              <span className="hidden sm:inline">By League</span>
              <span className="sm:hidden">League</span>
            </TabsTrigger>
            <TabsTrigger value="confidence" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              <span className="hidden sm:inline">Conf</span>
              <span className="sm:hidden">Conf</span>
            </TabsTrigger>
          </TabsList>

          {/* Win Rate Trend Chart */}
          <TabsContent value="trend" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Win Rate"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <ReferenceLine 
                    y={50} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3"
                    label={{ value: "50%", position: "right", fontSize: 10 }}
                  />
                  <ReferenceLine 
                    y={overallWinRate} 
                    stroke={COLORS.won} 
                    strokeDasharray="5 5"
                    label={{ value: `Avg: ${overallWinRate.toFixed(0)}%`, position: "right", fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeWinRate"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fill="url(#colorWinRate)"
                    name="Cumulative Win Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke={COLORS.won}
                    strokeWidth={2}
                    dot={{ fill: COLORS.won, r: 3 }}
                    name="Daily Win Rate"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                <span>Cumulative Win Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.won }} />
                <span>Daily Win Rate</span>
              </div>
            </div>
          </TabsContent>

          {/* Cumulative P/L Chart */}
          <TabsContent value="pl" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.won} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.won} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.lost} stopOpacity={0} />
                      <stop offset="95%" stopColor={COLORS.lost} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}u`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      const formatted = `${value > 0 ? '+' : ''}${value.toFixed(2)} units`;
                      if (name === "cumulativePL") return [formatted, "Cumulative P/L"];
                      if (name === "dailyPL") return [formatted, "Daily P/L"];
                      return [formatted, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <ReferenceLine 
                    y={0} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativePL"
                    stroke={dailyStats.length > 0 && dailyStats[dailyStats.length - 1].cumulativePL >= 0 ? COLORS.won : COLORS.lost}
                    strokeWidth={2}
                    fill={dailyStats.length > 0 && dailyStats[dailyStats.length - 1].cumulativePL >= 0 ? "url(#colorProfit)" : "url(#colorLoss)"}
                    name="Cumulative P/L"
                  />
                  <Bar 
                    dataKey="dailyPL" 
                    name="Daily P/L"
                    radius={[4, 4, 0, 0]}
                  >
                    {dailyStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.dailyPL >= 0 ? COLORS.won : COLORS.lost}
                        opacity={0.6}
                      />
                    ))}
                  </Bar>
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="text-xs text-muted-foreground">
                Based on 1 unit stakes at -110 odds
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.won }} />
                  <span>Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.lost }} />
                  <span>Loss</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* League Win Rate Trends Over Time */}
          <TabsContent value="league-trends" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leagueDailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <ReferenceLine 
                    y={50} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3"
                    label={{ value: "50%", position: "right", fontSize: 10 }}
                  />
                  <Legend />
                  {topLeagues.map((league, index) => (
                    <Line
                      key={league}
                      type="monotone"
                      dataKey={league}
                      stroke={LEAGUE_COLORS[index % LEAGUE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: LEAGUE_COLORS[index % LEAGUE_COLORS.length], r: 3 }}
                      name={league}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              {topLeagues.map((league, index) => (
                <div key={league} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: LEAGUE_COLORS[index % LEAGUE_COLORS.length] }} 
                  />
                  <span>{league}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Daily Results Chart */}
          <TabsContent value="daily" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="won" 
                    stackId="a" 
                    fill={COLORS.won} 
                    name="Won"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="lost" 
                    stackId="a" 
                    fill={COLORS.lost} 
                    name="Lost"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="pending" 
                    stackId="a" 
                    fill={COLORS.pending} 
                    name="Pending"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.won }} />
                <span>Won</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.lost }} />
                <span>Lost</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending }} />
                <span>Pending</span>
              </div>
            </div>
          </TabsContent>

          {/* League Performance Chart */}
          <TabsContent value="league" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={leaguePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="league" 
                    tick={{ fontSize: 11 }}
                    width={60}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "winRate") return [`${value.toFixed(1)}%`, "Win Rate"];
                      return [value, name];
                    }}
                  />
                  <ReferenceLine 
                    x={50} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3"
                  />
                  <Bar 
                    dataKey="winRate" 
                    name="Win Rate"
                    radius={[0, 4, 4, 0]}
                  >
                    {leaguePerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.winRate >= 50 ? COLORS.won : COLORS.lost}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {leaguePerformance.slice(0, 6).map((league) => (
                <div 
                  key={league.league}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs"
                >
                  <Badge variant="outline" className="text-[10px]">{league.league}</Badge>
                  <span className="font-medium">
                    {league.won}W-{league.lost}L
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Confidence vs Accuracy Chart */}
          <TabsContent value="confidence" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={confidenceVsAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="confidence" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: "Confidence Level", position: "bottom", fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: "Actual Win Rate", angle: -90, position: "insideLeft", fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "winRate") return [`${value.toFixed(1)}%`, "Actual Win Rate"];
                      if (name === "count") return [value, "Sample Size"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Confidence: ${label}%`}
                  />
                  {/* Perfect calibration line */}
                  <ReferenceLine 
                    segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    label={{ value: "Perfect", position: "top", fontSize: 10 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={COLORS.secondary}
                    opacity={0.3}
                    name="Sample Size"
                    yAxisId={1}
                  />
                  <YAxis 
                    yAxisId={1}
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: COLORS.primary, r: 5 }}
                    name="Actual Win Rate"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Compares prediction confidence levels to actual win rates. 
              Points above the diagonal line indicate over-performance.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PredictionCharts;
