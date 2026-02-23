import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, Brain, DollarSign, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function WhatIfCalculator() {
  const [flatStake, setFlatStake] = useState('25');

  // Fetch settled AI predictions
  const { data: predictions } = useQuery({
    queryKey: ['what-if-predictions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('algorithm_predictions')
        .select('*')
        .in('status', ['correct', 'incorrect'])
        .not('confidence', 'is', null)
        .order('predicted_at', { ascending: true })
        .limit(500);
      return data || [];
    },
  });

  const simulation = useMemo(() => {
    if (!predictions || predictions.length === 0) return null;

    const stake = parseFloat(flatStake) || 25;
    let cumProfit = 0;
    let totalStaked = 0;
    let wins = 0;
    let losses = 0;

    const chartData: { date: string; profit: number; label: string }[] = [];

    predictions.forEach(pred => {
      const confidence = pred.adjusted_confidence || pred.confidence || 50;
      // Only follow picks with confidence >= 55
      if (confidence < 55) return;

      // Simulate at -110 odds (standard) for simplicity
      const odds = -110;
      totalStaked += stake;

      if (pred.status === 'correct') {
        cumProfit += (stake * (100 / 110)); // Win at -110
        wins++;
      } else {
        cumProfit -= stake;
        losses++;
      }

      chartData.push({
        date: format(parseISO(pred.predicted_at), 'MMM d'),
        label: format(parseISO(pred.predicted_at), 'MMM d, yyyy'),
        profit: parseFloat(cumProfit.toFixed(2)),
      });
    });

    const totalBets = wins + losses;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    const roi = totalStaked > 0 ? (cumProfit / totalStaked) * 100 : 0;

    return {
      totalBets,
      wins,
      losses,
      winRate,
      totalStaked,
      totalProfit: cumProfit,
      roi,
      chartData,
    };
  }, [predictions, flatStake]);

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            What If You Followed the AI?
          </CardTitle>
          <CardDescription>
            See what your results would be if you'd placed flat bets on every AI pick with 55%+ confidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Label className="whitespace-nowrap">Flat stake per bet:</Label>
            <div className="relative w-32">
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={flatStake}
                onChange={(e) => setFlatStake(e.target.value)}
                className="pl-8"
                min="1"
                max="10000"
              />
            </div>
          </div>

          {simulation ? (
            <>
              {/* Results */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-card border text-center">
                  <Target className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{simulation.totalBets}</p>
                  <p className="text-xs text-muted-foreground">Bets Placed</p>
                </div>
                <div className="p-3 rounded-lg bg-card border text-center">
                  <Brain className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{simulation.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-card border text-center">
                  <DollarSign className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">
                    ${simulation.totalStaked.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Wagered</p>
                </div>
                <div className="p-3 rounded-lg bg-card border text-center">
                  {simulation.totalProfit >= 0
                    ? <TrendingUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
                    : <TrendingDown className="h-4 w-4 mx-auto text-red-500 mb-1" />
                  }
                  <p className={cn(
                    "text-xl font-bold",
                    simulation.totalProfit >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {simulation.totalProfit >= 0 ? '+' : '-'}${Math.abs(simulation.totalProfit).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hypothetical P&L ({simulation.roi >= 0 ? '+' : ''}{simulation.roi.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg border bg-muted/30 mb-6">
                <p className="text-sm">
                  {simulation.totalProfit >= 0 ? '✅' : '⚠️'}{' '}
                  If you had bet <strong>${flatStake}</strong> on every AI pick with 55%+ confidence at standard -110 odds,
                  you would have {simulation.totalProfit >= 0 ? 'profited' : 'lost'}{' '}
                  <strong className={simulation.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                    ${Math.abs(simulation.totalProfit).toFixed(2)}
                  </strong>{' '}
                  over <strong>{simulation.totalBets}</strong> bets
                  ({simulation.wins}W-{simulation.losses}L, {simulation.winRate.toFixed(1)}% win rate).
                </p>
              </div>

              {/* Chart */}
              {simulation.chartData.length > 1 && (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulation.chartData}>
                      <defs>
                        <linearGradient id="whatIfGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Hypothetical P&L']}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="hsl(var(--primary))"
                        fill="url(#whatIfGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading AI prediction history...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
