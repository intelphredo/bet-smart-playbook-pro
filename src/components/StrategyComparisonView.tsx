import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  Percent,
  Activity,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StrategyComparisonResult } from "@/hooks/useStrategyComparison";

interface StrategyComparisonViewProps {
  data: StrategyComparisonResult[];
  isLoading: boolean;
  startingBankroll: number;
}

const STRATEGY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b",
  "#8b5cf6",
];

const STRATEGY_ICONS: Record<string, string> = {
  'All 3 Agree': '🤝',
  '2+ Agree (Majority)': '👥',
  'Highest Confidence': '🎯',
  'Best Performer': '🏆',
  'ML Power Index': '🤖',
  'Value Pick Finder': '💎',
  'Statistical Edge': '📊',
};

export function StrategyComparisonView({ data, isLoading, startingBankroll }: StrategyComparisonViewProps) {
  const formatCurrency = (value: number) => {
    return value >= 0 ? `+$${value.toFixed(0)}` : `-$${Math.abs(value).toFixed(0)}`;
  };

  // Build cumulative P/L chart data
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Find all unique dates across all strategies
    const allDates = new Set<string>();
    data.forEach(s => s.result.profitByDay.forEach(d => allDates.add(d.date)));
    const sortedDates = Array.from(allDates).sort();

    // Build data points
    return sortedDates.map(date => {
      const point: Record<string, any> = { date };
      data.forEach(s => {
        const dayData = s.result.profitByDay.find(d => d.date === date);
        // Find the last known cumulative value up to this date
        const relevantDays = s.result.profitByDay.filter(d => d.date <= date);
        const lastDay = relevantDays[relevantDays.length - 1];
        point[s.strategyName] = lastDay?.cumulative || 0;
      });
      return point;
    });
  }, [data]);

  // Radar chart data for risk/reward comparison
  const radarData = useMemo(() => {
    if (data.length === 0) return [];

    const maxProfit = Math.max(...data.map(d => d.result.totalProfit), 1);
    const maxWinRate = Math.max(...data.map(d => d.result.winRate), 1);
    const maxROI = Math.max(...data.map(d => Math.abs(d.result.roi)), 1);
    const maxBets = Math.max(...data.map(d => d.result.totalBets), 1);

    return [
      { metric: 'Profit', fullMark: 100, ...Object.fromEntries(data.map(d => [d.strategyName, Math.max(0, (d.result.totalProfit / maxProfit) * 100)])) },
      { metric: 'Win Rate', fullMark: 100, ...Object.fromEntries(data.map(d => [d.strategyName, d.result.winRate])) },
      { metric: 'ROI', fullMark: 100, ...Object.fromEntries(data.map(d => [d.strategyName, Math.max(0, (d.result.roi / maxROI) * 100)])) },
      { metric: 'Volume', fullMark: 100, ...Object.fromEntries(data.map(d => [d.strategyName, (d.result.totalBets / maxBets) * 100])) },
      { metric: 'Consistency', fullMark: 100, ...Object.fromEntries(data.map(d => [d.strategyName, 100 - d.result.maxDrawdownPct])) },
    ];
  }, [data]);

  // Bar chart for Monte Carlo comparison
  const monteCarloBarData = useMemo(() => {
    return data
      .filter(d => d.monteCarloSummary)
      .map(d => ({
        name: d.strategyName,
        profitProb: d.monteCarloSummary!.profitProbability,
        medianProfit: d.monteCarloSummary!.medianProfit,
        avgDrawdown: d.monteCarloSummary!.avgMaxDrawdown,
        bustRisk: d.monteCarloSummary!.bustProbability,
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground text-sm">
            Run the comparison to see strategy performance
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-5 w-5 text-cyan-400" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-cyan-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((strategy, index) => (
          <Card 
            key={strategy.strategy}
            className={cn(
              "relative overflow-hidden transition-all",
              index === 0 && "border-yellow-500/50 bg-yellow-500/5 ring-1 ring-yellow-500/20"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRankIcon(index)}
                  <span className="text-lg">{STRATEGY_ICONS[strategy.strategyName]}</span>
                </div>
                <Badge 
                  variant={strategy.result.totalProfit >= 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {formatCurrency(strategy.result.totalProfit)}
                </Badge>
              </div>
              <CardTitle className="text-sm mt-2">{strategy.strategyName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded p-2 text-center">
                  <p className="font-bold">{strategy.result.winRate.toFixed(1)}%</p>
                  <p className="text-muted-foreground">Win Rate</p>
                </div>
                <div className="bg-muted/30 rounded p-2 text-center">
                  <p className={cn(
                    "font-bold",
                    strategy.result.roi >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {strategy.result.roi >= 0 ? '+' : ''}{strategy.result.roi.toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground">ROI</p>
                </div>
                <div className="bg-muted/30 rounded p-2 text-center">
                  <p className="font-bold">{strategy.result.totalBets}</p>
                  <p className="text-muted-foreground">Bets</p>
                </div>
                <div className="bg-muted/30 rounded p-2 text-center">
                  <p className="font-bold text-red-500">-{strategy.result.maxDrawdownPct.toFixed(0)}%</p>
                  <p className="text-muted-foreground">Drawdown</p>
                </div>
              </div>

              {/* Monte Carlo Summary */}
              {strategy.monteCarloSummary && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-medium mb-1 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Monte Carlo Risk Profile
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{strategy.monteCarloSummary.profitProbability.toFixed(0)}% profit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span>{strategy.monteCarloSummary.bustProbability.toFixed(1)}% bust</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Median: {formatCurrency(strategy.monteCarloSummary.medianProfit)}
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Rank ribbon for winner */}
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-0.5 rounded-bl">
                BEST
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Cumulative P/L Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cumulative Profit Comparison
          </CardTitle>
          <CardDescription>Track how each strategy performed over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  tickFormatter={(v) => `$${v}`}
                  className="text-xs" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                />
                <Legend />
                {data.map((strategy, index) => (
                  <Line
                    key={strategy.strategy}
                    type="monotone"
                    dataKey={strategy.strategyName}
                    stroke={STRATEGY_COLORS[index % STRATEGY_COLORS.length]}
                    strokeWidth={index === 0 ? 3 : 2}
                    dot={false}
                    strokeDasharray={index > 2 ? "5 5" : undefined}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monte Carlo Profit Probability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Profit Probability (Monte Carlo)
            </CardTitle>
            <CardDescription>Likelihood of ending in profit based on 500 simulations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monteCarloBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Profit Probability']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="profitProb" radius={[0, 4, 4, 0]}>
                    {monteCarloBarData.map((_, index) => (
                      <Cell key={index} fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Profile Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategy Profile Comparison
            </CardTitle>
            <CardDescription>Multi-dimensional comparison of strategy characteristics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {data.slice(0, 4).map((strategy, index) => (
                    <Radar
                      key={strategy.strategy}
                      name={strategy.strategyName}
                      dataKey={strategy.strategyName}
                      stroke={STRATEGY_COLORS[index % STRATEGY_COLORS.length]}
                      fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Detailed Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Rank</th>
                  <th className="text-left py-2 px-2">Strategy</th>
                  <th className="text-right py-2 px-2">P/L</th>
                  <th className="text-right py-2 px-2">ROI</th>
                  <th className="text-right py-2 px-2">Win Rate</th>
                  <th className="text-right py-2 px-2">Bets</th>
                  <th className="text-right py-2 px-2">Max DD</th>
                  <th className="text-right py-2 px-2">Win Streak</th>
                  <th className="text-right py-2 px-2">Profit Prob</th>
                  <th className="text-right py-2 px-2">Bust Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.map((strategy, index) => (
                  <tr key={strategy.strategy} className={cn(
                    "border-b",
                    index === 0 && "bg-yellow-500/5"
                  )}>
                    <td className="py-2 px-2">{getRankIcon(index)}</td>
                    <td className="py-2 px-2 font-medium">
                      <span className="mr-1">{STRATEGY_ICONS[strategy.strategyName]}</span>
                      {strategy.strategyName}
                    </td>
                    <td className={cn(
                      "py-2 px-2 text-right font-bold",
                      strategy.result.totalProfit >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {formatCurrency(strategy.result.totalProfit)}
                    </td>
                    <td className={cn(
                      "py-2 px-2 text-right",
                      strategy.result.roi >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {strategy.result.roi >= 0 ? '+' : ''}{strategy.result.roi.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-right">{strategy.result.winRate.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right">{strategy.result.totalBets}</td>
                    <td className="py-2 px-2 text-right text-red-500">-{strategy.result.maxDrawdownPct.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right">{strategy.result.longestWinStreak}</td>
                    <td className="py-2 px-2 text-right">
                      {strategy.monteCarloSummary ? `${strategy.monteCarloSummary.profitProbability.toFixed(0)}%` : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {strategy.monteCarloSummary ? (
                        <span className={cn(
                          strategy.monteCarloSummary.bustProbability > 10 ? "text-red-500" : 
                          strategy.monteCarloSummary.bustProbability > 5 ? "text-yellow-500" : "text-green-500"
                        )}>
                          {strategy.monteCarloSummary.bustProbability.toFixed(1)}%
                        </span>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
