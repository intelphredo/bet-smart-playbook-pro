import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Target, 
  Dice6, ThumbsDown, ThumbsUp, Sparkles, AlertOctagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserBet } from '@/types/betting';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface ValueRealizationProps {
  bets: UserBet[];
}

interface EVComparison {
  bet: UserBet;
  expectedEV: number;
  realizedEV: number;
  variance: number;
  isLucky: boolean;
}

function calculateEVComparison(bets: UserBet[]): EVComparison[] {
  return bets
    .filter(b => b.status === 'won' || b.status === 'lost')
    .filter(b => b.model_ev_percentage !== undefined)
    .map(bet => {
      const expectedEV = bet.model_ev_percentage || 0;
      const realizedEV = bet.status === 'won' 
        ? ((bet.result_profit || 0) / bet.stake) * 100 
        : -100;
      const variance = realizedEV - expectedEV;
      const isLucky = variance > 10;

      return {
        bet,
        expectedEV,
        realizedEV,
        variance,
        isLucky,
      };
    });
}

export function ValueRealization({ bets }: ValueRealizationProps) {
  const settledBets = useMemo(() => 
    bets.filter(b => b.status === 'won' || b.status === 'lost'),
    [bets]
  );

  const evComparisons = useMemo(() => 
    calculateEVComparison(bets),
    [bets]
  );

  const avgExpectedEV = useMemo(() => {
    if (evComparisons.length === 0) return 0;
    return evComparisons.reduce((sum, c) => sum + c.expectedEV, 0) / evComparisons.length;
  }, [evComparisons]);

  const avgRealizedEV = useMemo(() => {
    if (evComparisons.length === 0) return 0;
    return evComparisons.reduce((sum, c) => sum + c.realizedEV, 0) / evComparisons.length;
  }, [evComparisons]);

  const variance = avgRealizedEV - avgExpectedEV;
  const isRunningHot = variance > 5;
  const isRunningCold = variance < -5;

  // Calculate if model is well-calibrated
  const calibrationScore = useMemo(() => {
    if (evComparisons.length < 10) return null;
    
    // Group by expected EV buckets and compare to actual win rate
    const buckets: Record<string, { expected: number; wins: number; total: number }> = {};
    
    evComparisons.forEach(c => {
      const bucket = Math.floor(c.expectedEV / 5) * 5;
      const key = `${bucket}-${bucket + 5}`;
      if (!buckets[key]) {
        buckets[key] = { expected: bucket + 2.5, wins: 0, total: 0 };
      }
      buckets[key].total++;
      if (c.bet.status === 'won') buckets[key].wins++;
    });

    let calibrationError = 0;
    let count = 0;
    
    Object.values(buckets).forEach(b => {
      if (b.total >= 3) {
        const actualWinRate = (b.wins / b.total) * 100;
        // For positive EV bets, we expect a higher win rate
        const expectedWinRate = 50 + b.expected * 0.5; // Rough approximation
        calibrationError += Math.abs(actualWinRate - expectedWinRate);
        count++;
      }
    });

    return count > 0 ? 100 - (calibrationError / count) : null;
  }, [evComparisons]);

  const diagnosis = useMemo(() => {
    if (evComparisons.length < 5) {
      return {
        icon: AlertTriangle,
        color: 'text-amber-500',
        title: 'Insufficient Data',
        description: 'Need at least 5 settled bets with EV data for meaningful analysis.',
      };
    }

    if (isRunningHot) {
      return {
        icon: Dice6,
        color: 'text-green-500',
        title: 'Running Hot 🔥',
        description: `You're ${Math.abs(variance).toFixed(1)}% above expected. Enjoy it, but don't expect it to last. Variance will regress to the mean.`,
      };
    }

    if (isRunningCold) {
      return {
        icon: ThumbsDown,
        color: 'text-red-500',
        title: 'Running Cold ❄️',
        description: `You're ${Math.abs(variance).toFixed(1)}% below expected. If the model's EV was correct, you've been unlucky. Stay disciplined.`,
      };
    }

    return {
      icon: Target,
      color: 'text-primary',
      title: 'Performing as Expected',
      description: 'Your realized value is close to expected. The model appears well-calibrated for your bets.',
    };
  }, [evComparisons.length, isRunningHot, isRunningCold, variance]);

  const scatterData = evComparisons.map((c, i) => ({
    x: c.expectedEV,
    y: c.realizedEV,
    name: c.bet.match_title,
    status: c.bet.status,
  }));

  if (settledBets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No settled bets to analyze.</p>
          <p className="text-sm text-muted-foreground mt-1">Place bets with EV data to track value realization.</p>
        </CardContent>
      </Card>
    );
  }

  const DiagnosisIcon = diagnosis.icon;

  return (
    <div className="space-y-6">
      {/* Diagnosis Banner */}
      <Card className={cn(
        "border-l-4",
        isRunningHot && "border-l-green-500 bg-green-500/5",
        isRunningCold && "border-l-red-500 bg-red-500/5",
        !isRunningHot && !isRunningCold && "border-l-primary bg-primary/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-full",
              isRunningHot && "bg-green-500/20",
              isRunningCold && "bg-red-500/20",
              !isRunningHot && !isRunningCold && "bg-primary/20"
            )}>
              <DiagnosisIcon className={cn("h-6 w-6", diagnosis.color)} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{diagnosis.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {diagnosis.description}
              </p>
            </div>
            {calibrationScore !== null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Model Calibration</p>
                <p className={cn(
                  "text-xl font-bold",
                  calibrationScore >= 80 && "text-green-500",
                  calibrationScore >= 60 && calibrationScore < 80 && "text-amber-500",
                  calibrationScore < 60 && "text-red-500"
                )}>
                  {calibrationScore.toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* EV Comparison Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Avg Expected EV</p>
            <p className={cn(
              "text-2xl font-bold",
              avgExpectedEV >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {avgExpectedEV >= 0 ? '+' : ''}{avgExpectedEV.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Avg Realized EV</p>
            <p className={cn(
              "text-2xl font-bold",
              avgRealizedEV >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {avgRealizedEV >= 0 ? '+' : ''}{avgRealizedEV.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className={cn(
              "text-2xl font-bold",
              variance >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
            </p>
            <Badge variant={variance >= 0 ? "success" : "destructive"} className="mt-1 text-[10px]">
              {variance >= 0 ? 'Lucky' : 'Unlucky'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* EV Scatter Plot */}
      {evComparisons.length >= 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expected vs Realized Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Expected EV" 
                    unit="%" 
                    domain={[-20, 30]}
                    className="text-muted-foreground"
                    label={{ value: 'Expected EV %', position: 'bottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Realized EV" 
                    unit="%" 
                    domain={[-100, 200]}
                    className="text-muted-foreground"
                    label={{ value: 'Realized EV %', angle: -90, position: 'left' }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`, 
                      name === 'x' ? 'Expected' : 'Realized'
                    ]}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.status === 'won' ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Green dots = wins, Red dots = losses. Points above Y=0 are profitable.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Individual Bet Variance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bet-by-Bet Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {evComparisons.slice(0, 20).map((c, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    c.bet.status === 'won' ? "bg-green-500/5" : "bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {c.bet.status === 'won' ? (
                      <ThumbsUp className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.bet.match_title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.bet.selection} • ${c.bet.stake}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Expected</p>
                        <p className="text-xs font-medium">{c.expectedEV >= 0 ? '+' : ''}{c.expectedEV.toFixed(1)}%</p>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Actual</p>
                        <p className={cn(
                          "text-xs font-bold",
                          c.realizedEV >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {c.realizedEV >= 0 ? '+' : ''}{c.realizedEV.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ValueRealization;
