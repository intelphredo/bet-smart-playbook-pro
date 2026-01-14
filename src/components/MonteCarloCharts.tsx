import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine
} from "recharts";
import { 
  Dices, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Percent,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonteCarloResult } from "@/hooks/useMonteCarloSimulation";

interface MonteCarloChartsProps {
  result: MonteCarloResult;
  startingBankroll: number;
}

export function MonteCarloCharts({ result, startingBankroll }: MonteCarloChartsProps) {
  const formatCurrency = (value: number) => {
    return value >= 0 ? `+$${value.toFixed(0)}` : `-$${Math.abs(value).toFixed(0)}`;
  };

  const ConfidenceBandTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium mb-1">Step {label}</p>
          <p className="text-muted-foreground">95th: ${payload[0]?.payload?.p95?.toFixed(0)}</p>
          <p className="text-muted-foreground">75th: ${payload[0]?.payload?.p75?.toFixed(0)}</p>
          <p className="font-medium">Median: ${payload[0]?.payload?.p50?.toFixed(0)}</p>
          <p className="text-muted-foreground">25th: ${payload[0]?.payload?.p25?.toFixed(0)}</p>
          <p className="text-muted-foreground">5th: ${payload[0]?.payload?.p5?.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  const DistributionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium">{payload[0]?.payload?.range}</p>
          <p>{payload[0]?.value?.toFixed(1)}% of simulations</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn(
          "border-2",
          result.profitProbability >= 50 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  result.profitProbability >= 50 ? "text-green-500" : "text-red-500"
                )}>
                  {result.profitProbability.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Profit Probability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          result.bustProbability < 5 ? "border-green-500/30 bg-green-500/5" : 
          result.bustProbability < 20 ? "border-yellow-500/30 bg-yellow-500/5" : 
          "border-red-500/30 bg-red-500/5"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                result.bustProbability < 5 ? "text-green-500" : 
                result.bustProbability < 20 ? "text-yellow-500" : "text-red-500"
              )} />
              <div>
                <p className="text-2xl font-bold">
                  {result.bustProbability.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Bust Probability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  ${result.percentiles.p50.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Median Final Bankroll</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {result.avgMaxDrawdown.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Max Drawdown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Bands Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Dices className="h-5 w-5" />
            Confidence Bands (90% Interval)
          </CardTitle>
          <CardDescription>
            Simulated bankroll paths showing 5th to 95th percentile outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.cumulativePaths}>
                <defs>
                  <linearGradient id="outer-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="inner-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="step" tick={{ fontSize: 12 }} label={{ value: 'Bets', position: 'bottom', offset: -5 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ConfidenceBandTooltip />} />
                <ReferenceLine y={startingBankroll} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                
                {/* 5-95 percentile band (outer) */}
                <Area 
                  type="monotone" 
                  dataKey="p95" 
                  stroke="none"
                  fill="url(#outer-gradient)"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="p5" 
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                
                {/* 25-75 percentile band (inner) */}
                <Area 
                  type="monotone" 
                  dataKey="p75" 
                  stroke="none"
                  fill="url(#inner-gradient)"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="p25" 
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                
                {/* Median line */}
                <Area 
                  type="monotone" 
                  dataKey="p50" 
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-chart-1"></div>
              <span>Median (50th)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-chart-1/30"></div>
              <span>25th-75th</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-chart-3/20"></div>
              <span>5th-95th</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit/Loss Distribution</CardTitle>
            <CardDescription>
              Histogram of final P/L across all simulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <YAxis type="category" dataKey="range" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={<DistributionTooltip />} />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {result.distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.range.includes('-$') || entry.range.startsWith('$-') 
                          ? 'hsl(var(--destructive))' 
                          : 'hsl(var(--chart-1))'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Drawdown Distribution</CardTitle>
            <CardDescription>
              Maximum drawdown experienced across simulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.drawdownDistribution.map((bucket, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{bucket.range}</span>
                    <span className="font-medium">{bucket.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={bucket.percentage} 
                    className={cn(
                      "h-2",
                      idx <= 1 ? "[&>div]:bg-green-500" :
                      idx === 2 ? "[&>div]:bg-yellow-500" :
                      "[&>div]:bg-red-500"
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Percentile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outcome Percentiles</CardTitle>
          <CardDescription>
            Range of possible outcomes based on {result.simulations.length} simulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-muted-foreground mb-1">Worst 5%</p>
              <p className={cn(
                "text-lg font-bold",
                result.profitPercentiles.p5 >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(result.profitPercentiles.p5)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-muted-foreground mb-1">25th %ile</p>
              <p className={cn(
                "text-lg font-bold",
                result.profitPercentiles.p25 >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(result.profitPercentiles.p25)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground mb-1">Median</p>
              <p className={cn(
                "text-lg font-bold",
                result.profitPercentiles.p50 >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(result.profitPercentiles.p50)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground mb-1">75th %ile</p>
              <p className={cn(
                "text-lg font-bold",
                result.profitPercentiles.p75 >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(result.profitPercentiles.p75)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground mb-1">Best 5%</p>
              <p className={cn(
                "text-lg font-bold",
                result.profitPercentiles.p95 >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(result.profitPercentiles.p95)}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            💡 There's a 50% chance your actual result falls between the 25th and 75th percentile
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
