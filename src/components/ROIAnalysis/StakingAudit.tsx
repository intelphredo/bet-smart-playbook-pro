import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, Scale, TrendingUp, TrendingDown,
  DollarSign, ArrowUp, ArrowDown, Minus, Calculator, Skull
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserBet } from '@/types/betting';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

interface StakingAuditProps {
  bets: UserBet[];
}

interface StakingDeviation {
  bet: UserBet;
  recommendedStake: number;
  actualStake: number;
  deviationPercent: number;
  deviationType: 'over' | 'under' | 'aligned';
  potentialProfit: number;
  actualProfit: number;
  impactOnROI: number;
}

function analyzeStakingDeviations(bets: UserBet[]): StakingDeviation[] {
  return bets
    .filter(b => b.status === 'won' || b.status === 'lost')
    .filter(b => b.kelly_stake_recommended !== undefined && b.kelly_stake_recommended > 0)
    .map(bet => {
      const recommended = bet.kelly_stake_recommended || 0;
      const actual = bet.stake;
      const deviationPercent = ((actual - recommended) / recommended) * 100;
      
      let deviationType: 'over' | 'under' | 'aligned' = 'aligned';
      if (deviationPercent > 20) deviationType = 'over';
      else if (deviationPercent < -20) deviationType = 'under';

      // Calculate what profit would have been with recommended stake
      const actualProfit = bet.result_profit || 0;
      const profitRatio = bet.status === 'won' 
        ? (bet.result_profit || 0) / actual 
        : -1;
      const potentialProfit = recommended * profitRatio;
      const impactOnROI = actualProfit - potentialProfit;

      return {
        bet,
        recommendedStake: recommended,
        actualStake: actual,
        deviationPercent,
        deviationType,
        potentialProfit,
        actualProfit,
        impactOnROI,
      };
    })
    .sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));
}

export function StakingAudit({ bets }: StakingAuditProps) {
  const deviations = useMemo(() => analyzeStakingDeviations(bets), [bets]);

  const compliance = useMemo(() => {
    if (deviations.length === 0) return { aligned: 0, over: 0, under: 0, total: 0 };
    
    const aligned = deviations.filter(d => d.deviationType === 'aligned').length;
    const over = deviations.filter(d => d.deviationType === 'over').length;
    const under = deviations.filter(d => d.deviationType === 'under').length;
    
    return {
      aligned,
      over,
      under,
      total: deviations.length,
      alignedPercent: (aligned / deviations.length) * 100,
      overPercent: (over / deviations.length) * 100,
      underPercent: (under / deviations.length) * 100,
    };
  }, [deviations]);

  const totalImpact = useMemo(() => 
    deviations.reduce((sum, d) => sum + d.impactOnROI, 0),
    [deviations]
  );

  const avgDeviation = useMemo(() => {
    if (deviations.length === 0) return 0;
    return deviations.reduce((sum, d) => sum + d.deviationPercent, 0) / deviations.length;
  }, [deviations]);

  // Calculate what-if with perfect Kelly following
  const perfectKellyResults = useMemo(() => {
    let totalRecommendedStaked = 0;
    let totalActualStaked = 0;
    let potentialProfit = 0;
    let actualProfit = 0;

    deviations.forEach(d => {
      totalRecommendedStaked += d.recommendedStake;
      totalActualStaked += d.actualStake;
      potentialProfit += d.potentialProfit;
      actualProfit += d.actualProfit;
    });

    return {
      totalRecommendedStaked,
      totalActualStaked,
      potentialProfit,
      actualProfit,
      difference: actualProfit - potentialProfit,
      potentialROI: totalRecommendedStaked > 0 ? (potentialProfit / totalRecommendedStaked) * 100 : 0,
      actualROI: totalActualStaked > 0 ? (actualProfit / totalActualStaked) * 100 : 0,
    };
  }, [deviations]);

  const chartData = [
    { 
      name: 'Over-staked', 
      value: compliance.over, 
      fill: '#ef4444',
      description: `${compliance.over} bets where you bet more than recommended`
    },
    { 
      name: 'Aligned', 
      value: compliance.aligned, 
      fill: '#22c55e',
      description: `${compliance.aligned} bets within ±20% of recommendation`
    },
    { 
      name: 'Under-staked', 
      value: compliance.under, 
      fill: '#3b82f6',
      description: `${compliance.under} bets where you bet less than recommended`
    },
  ];

  const diagnosis = useMemo(() => {
    if (deviations.length < 5) {
      return {
        type: 'warning',
        title: 'Insufficient Data',
        message: 'Need at least 5 bets with Kelly recommendations to audit your staking.',
      };
    }

    if (compliance.alignedPercent >= 70) {
      return {
        type: 'success',
        title: 'Disciplined Staker ✓',
        message: `You followed Kelly recommendations ${compliance.alignedPercent.toFixed(0)}% of the time. This disciplined approach maximizes long-term growth.`,
      };
    }

    if (avgDeviation > 30) {
      return {
        type: 'danger',
        title: 'Chronic Over-Staker ⚠️',
        message: `You're betting ${avgDeviation.toFixed(0)}% more than recommended on average. This increases variance and risk of ruin.`,
      };
    }

    if (avgDeviation < -30) {
      return {
        type: 'info',
        title: 'Conservative Staker',
        message: `You're betting ${Math.abs(avgDeviation).toFixed(0)}% less than recommended. You're leaving potential value on the table.`,
      };
    }

    return {
      type: 'neutral',
      title: 'Mixed Discipline',
      message: `Your staking discipline is inconsistent. Consider following Kelly recommendations more closely.`,
    };
  }, [deviations.length, compliance.alignedPercent, avgDeviation]);

  if (deviations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No bets with Kelly recommendations found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Place bets using our AI recommendations to track staking discipline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diagnosis Banner */}
      <Card className={cn(
        "border-l-4",
        diagnosis.type === 'success' && "border-l-green-500 bg-green-500/5",
        diagnosis.type === 'danger' && "border-l-red-500 bg-red-500/5",
        diagnosis.type === 'info' && "border-l-blue-500 bg-blue-500/5",
        diagnosis.type === 'warning' && "border-l-amber-500 bg-amber-500/5",
        diagnosis.type === 'neutral' && "border-l-muted-foreground bg-muted/30"
      )}>
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-full",
              diagnosis.type === 'success' && "bg-green-500/20",
              diagnosis.type === 'danger' && "bg-red-500/20",
              diagnosis.type === 'info' && "bg-blue-500/20",
              diagnosis.type === 'warning' && "bg-amber-500/20",
              diagnosis.type === 'neutral' && "bg-muted"
            )}>
              <Scale className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{diagnosis.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {diagnosis.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">ROI Impact</p>
            <p className={cn(
              "text-2xl font-bold",
              totalImpact >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {totalImpact >= 0 ? '+' : ''}${totalImpact.toFixed(0)}
            </p>
            <Badge variant={totalImpact >= 0 ? "success" : "destructive"} className="mt-1 text-[10px]">
              {totalImpact >= 0 ? 'Gained' : 'Lost'} from deviations
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Avg Deviation</p>
            <p className={cn(
              "text-2xl font-bold",
              avgDeviation > 0 ? "text-amber-500" : avgDeviation < 0 ? "text-blue-500" : "text-green-500"
            )}>
              {avgDeviation >= 0 ? '+' : ''}{avgDeviation.toFixed(0)}%
            </p>
            <Badge variant="outline" className="mt-1 text-[10px]">
              {avgDeviation > 0 ? 'Over-betting' : avgDeviation < 0 ? 'Under-betting' : 'On target'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Kelly Compliance</p>
            <p className={cn(
              "text-2xl font-bold",
              compliance.alignedPercent >= 70 ? "text-green-500" : 
              compliance.alignedPercent >= 40 ? "text-amber-500" : "text-red-500"
            )}>
              {compliance.alignedPercent.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {compliance.aligned} of {compliance.total} bets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">If Perfect Kelly</p>
            <p className={cn(
              "text-2xl font-bold",
              perfectKellyResults.difference > 0 ? "text-red-500" : "text-green-500"
            )}>
              {perfectKellyResults.difference > 0 ? '-' : '+'}${Math.abs(perfectKellyResults.difference).toFixed(0)}
            </p>
            <Badge 
              variant={perfectKellyResults.difference <= 0 ? "success" : "destructive"} 
              className="mt-1 text-[10px]"
            >
              {perfectKellyResults.difference <= 0 ? 'Outperformed' : 'Underperformed'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Staking Discipline Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis type="category" dataKey="name" width={100} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} bets`,
                    props.payload.description
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual Deviations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Biggest Staking Deviations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {deviations.slice(0, 15).map((d, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    d.deviationType === 'over' && "bg-red-500/5",
                    d.deviationType === 'under' && "bg-blue-500/5",
                    d.deviationType === 'aligned' && "bg-green-500/5"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {d.deviationType === 'over' && <ArrowUp className="h-4 w-4 text-red-500 shrink-0" />}
                    {d.deviationType === 'under' && <ArrowDown className="h-4 w-4 text-blue-500 shrink-0" />}
                    {d.deviationType === 'aligned' && <Minus className="h-4 w-4 text-green-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{d.bet.match_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.bet.status === 'won' ? '✓ Won' : '✗ Lost'} • {d.bet.selection}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Recommended</p>
                        <p className="text-xs font-medium">${d.recommendedStake.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Actual</p>
                        <p className={cn(
                          "text-xs font-bold",
                          d.deviationType === 'over' && "text-red-500",
                          d.deviationType === 'under' && "text-blue-500",
                          d.deviationType === 'aligned' && "text-green-500"
                        )}>
                          ${d.actualStake.toFixed(0)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px]",
                          d.deviationType === 'over' && "text-red-500 border-red-500/30",
                          d.deviationType === 'under' && "text-blue-500 border-blue-500/30",
                          d.deviationType === 'aligned' && "text-green-500 border-green-500/30"
                        )}
                      >
                        {d.deviationPercent >= 0 ? '+' : ''}{d.deviationPercent.toFixed(0)}%
                      </Badge>
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

export default StakingAudit;
