import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  BarChart3,
  Trophy,
  Zap,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSharpMoneyROI, useSharpMoneyLeaderboard } from "@/hooks/useSharpMoneyLeaderboard";
import { InfoExplainer } from "@/components/ui/InfoExplainer";
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
  PieChart as RechartsPie,
  Pie,
} from "recharts";

const SIGNAL_COLORS: Record<string, string> = {
  steam_move: "#ef4444",
  reverse_line: "#f59e0b",
  money_split: "#8b5cf6",
  whale_bet: "#3b82f6",
  sharp_action: "#10b981",
};

const SIGNAL_LABELS: Record<string, string> = {
  steam_move: "Steam Move",
  reverse_line: "Reverse Line",
  money_split: "Money Split",
  whale_bet: "Whale Bet",
  sharp_action: "Sharp Action",
};

export default function ROITracker() {
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const { data: roiData, isLoading: roiLoading } = useSharpMoneyROI();
  const { data: leaderboard, isLoading: leaderboardLoading } = useSharpMoneyLeaderboard();

  const isLoading = roiLoading || leaderboardLoading;

  // Calculate totals
  const totals = roiData?.reduce(
    (acc, signal) => ({
      totalBets: acc.totalBets + signal.totalBets,
      wins: acc.wins + signal.wins,
      losses: acc.losses + signal.losses,
      profit: acc.profit + signal.profit,
      totalStaked: acc.totalStaked + signal.totalStaked,
    }),
    { totalBets: 0, wins: 0, losses: 0, profit: 0, totalStaked: 0 }
  ) || { totalBets: 0, wins: 0, losses: 0, profit: 0, totalStaked: 0 };

  const overallROI = totals.totalStaked > 0 
    ? (totals.profit / totals.totalStaked) * 100 
    : 0;
  const overallWinRate = totals.totalBets > 0 
    ? (totals.wins / (totals.wins + totals.losses)) * 100 
    : 0;

  // Prepare chart data
  const signalChartData = roiData?.map(signal => ({
    name: SIGNAL_LABELS[signal.signalType] || signal.signalType,
    roi: signal.roi,
    profit: signal.profit,
    wins: signal.wins,
    losses: signal.losses,
    fill: SIGNAL_COLORS[signal.signalType] || "#6b7280",
  })) || [];

  const pieData = roiData?.map(signal => ({
    name: SIGNAL_LABELS[signal.signalType] || signal.signalType,
    value: signal.totalBets,
    fill: SIGNAL_COLORS[signal.signalType] || "#6b7280",
  })) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      
      <main id="main-content" className="flex-1 container px-4 py-6 mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              ROI Tracker
              <InfoExplainer term="roi" />
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track returns and performance across all signal types
            </p>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Profit"
            value={`${totals.profit >= 0 ? '+' : ''}$${totals.profit.toFixed(0)}`}
            icon={DollarSign}
            trend={totals.profit >= 0 ? "up" : "down"}
            isLoading={isLoading}
          />
          <StatCard
            title="Overall ROI"
            value={`${overallROI >= 0 ? '+' : ''}${overallROI.toFixed(1)}%`}
            icon={TrendingUp}
            trend={overallROI >= 0 ? "up" : "down"}
            isLoading={isLoading}
          />
          <StatCard
            title="Win Rate"
            value={`${overallWinRate.toFixed(1)}%`}
            icon={Target}
            subtitle={`${totals.wins}W - ${totals.losses}L`}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Bets"
            value={totals.totalBets.toString()}
            icon={BarChart3}
            subtitle={`$${totals.totalStaked.toFixed(0)} staked`}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="breakdown" className="space-y-4">
          <TabsList>
            <TabsTrigger value="breakdown" className="gap-2">
              <PieChart className="h-4 w-4" />
              Signal Breakdown
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="streaks" className="gap-2">
              <Zap className="h-4 w-4" />
              Streaks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* ROI by Signal Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    ROI by Signal Type
                    <InfoExplainer term="sharp_action" size="sm" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={signalChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }} 
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          tickFormatter={(v) => `${v}%`}
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                          {signalChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bet Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Signal Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[180px]" />
                ))
              ) : (
                roiData?.map((signal) => (
                  <SignalROICard key={signal.signalType} signal={signal} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profit Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={signalChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-muted-foreground" />
                      <YAxis 
                        tickFormatter={(v) => `$${v}`}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Signal Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard?.sort((a, b) => b.winRate - a.winRate).map((signal, i) => (
                        <div 
                          key={signal.signalType}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              i === 0 && "bg-yellow-500 text-yellow-950",
                              i === 1 && "bg-gray-300 text-gray-700",
                              i === 2 && "bg-amber-600 text-amber-50",
                              i > 2 && "bg-muted text-muted-foreground"
                            )}>
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium text-sm">
                                {SIGNAL_LABELS[signal.signalType] || signal.signalType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {signal.totalPredictions} predictions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{signal.winRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">
                              {signal.wins}W - {signal.losses}L
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaks" className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[140px]" />
                ))
              ) : (
                roiData?.map((signal) => (
                  <Card key={signal.signalType}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SIGNAL_COLORS[signal.signalType] }}
                        />
                        {SIGNAL_LABELS[signal.signalType] || signal.signalType}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Streak</p>
                          <p className={cn(
                            "font-bold",
                            signal.currentStreak > 0 && "text-green-500",
                            signal.currentStreak < 0 && "text-red-500"
                          )}>
                            {signal.currentStreak > 0 ? `${signal.currentStreak}W` : 
                             signal.currentStreak < 0 ? `${Math.abs(signal.currentStreak)}L` : '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Best Streak</p>
                          <p className="font-bold text-green-500">{signal.bestStreak}W</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Worst: {signal.worstStreak}L</span>
                        <span className="text-muted-foreground">Avg Odds: {signal.avgOdds.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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
  subtitle,
  isLoading 
}: { 
  title: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string }>; 
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className={cn(
          "text-xl font-bold",
          trend === "up" && "text-green-500",
          trend === "down" && "text-red-500"
        )}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SignalROICard({ signal }: { signal: any }) {
  const winRate = signal.totalBets > 0 
    ? (signal.wins / (signal.wins + signal.losses)) * 100 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SIGNAL_COLORS[signal.signalType] }}
            />
            {SIGNAL_LABELS[signal.signalType] || signal.signalType}
          </CardTitle>
          <Badge 
            variant={signal.roi >= 0 ? "default" : "destructive"}
            className="text-xs"
          >
            {signal.roi >= 0 ? '+' : ''}{signal.roi.toFixed(1)}% ROI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Profit</span>
          <span className={cn(
            "font-medium",
            signal.profit >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {signal.profit >= 0 ? '+' : ''}${signal.profit.toFixed(0)}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Win Rate</span>
            <span>{winRate.toFixed(1)}%</span>
          </div>
          <Progress value={winRate} className="h-1.5" />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{signal.wins}W - {signal.losses}L</span>
          <span>{signal.totalBets} total bets</span>
        </div>
      </CardContent>
    </Card>
  );
}
