import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RollingPerformanceChartProps {
  profitByDay: Array<{
    date: string;
    profit: number;
    cumulative: number;
    bankroll: number;
  }>;
}

type RollingWindow = 7 | 14 | 30 | 'cumulative';

export function RollingPerformanceChart({ profitByDay }: RollingPerformanceChartProps) {
  const [window, setWindow] = useState<RollingWindow>('cumulative');

  const chartData = useMemo(() => {
    if (window === 'cumulative') {
      return profitByDay.map(d => ({
        date: d.date,
        value: d.cumulative,
        label: 'Cumulative P/L',
      }));
    }

    // Calculate rolling sum
    return profitByDay.map((day, idx) => {
      const startIdx = Math.max(0, idx - window + 1);
      const windowData = profitByDay.slice(startIdx, idx + 1);
      const rollingSum = windowData.reduce((sum, d) => sum + d.profit, 0);
      
      return {
        date: day.date,
        value: rollingSum,
        label: `${window}-Day Rolling P/L`,
      };
    });
  }, [profitByDay, window]);

  const latestValue = chartData[chartData.length - 1]?.value || 0;
  const isPositive = latestValue >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          <p className={cn(
            "text-sm font-bold",
            value >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {window === 'cumulative' ? 'Cumulative' : `${window}-day rolling`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            Performance Over Time
          </CardTitle>
          <div className="flex gap-1">
            {(['cumulative', 7, 14, 30] as RollingWindow[]).map((w) => (
              <Button
                key={w}
                variant={window === w ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setWindow(w)}
              >
                {w === 'cumulative' ? 'Cumulative' : `${w}D`}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
            {isPositive ? '+' : '-'}${Math.abs(latestValue).toFixed(0)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {window === 'cumulative' ? 'Total P/L' : `Last ${window} days`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {profitByDay.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="rollingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No data to display</p>
        )}
      </CardContent>
    </Card>
  );
}
