import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, TrendingUp, TrendingDown, 
  DollarSign, Target, AlertTriangle, Sparkles, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserBet } from '@/types/betting';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface WhatIfAnalysisProps {
  bets: UserBet[];
  startingBankroll?: number;
}

interface BankrollTimeline {
  date: string;
  actual: number;
  recommended: number;
  aiPerfect: number;
}

export function WhatIfAnalysis({ bets, startingBankroll = 1000 }: WhatIfAnalysisProps) {
  // Sort bets by date
  const sortedBets = useMemo(() => 
    [...bets]
      .filter(b => b.status === 'won' || b.status === 'lost')
      .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()),
    [bets]
  );

  // Calculate timeline for all scenarios
  const timeline = useMemo(() => {
    let actualBankroll = startingBankroll;
    let recommendedBankroll = startingBankroll;
    let aiPerfectBankroll = startingBankroll;
    
    const points: BankrollTimeline[] = [{
      date: 'Start',
      actual: actualBankroll,
      recommended: recommendedBankroll,
      aiPerfect: aiPerfectBankroll,
    }];

    sortedBets.forEach((bet, i) => {
      // Actual: What actually happened
      actualBankroll += bet.result_profit || 0;

      // Recommended: If they followed Kelly stakes
      if (bet.kelly_stake_recommended && bet.kelly_stake_recommended > 0) {
        const kellyStake = bet.kelly_stake_recommended;
        if (bet.status === 'won') {
          // Calculate profit at recommended stake
          const profitRatio = (bet.result_profit || 0) / bet.stake;
          recommendedBankroll += kellyStake * profitRatio;
        } else {
          recommendedBankroll -= kellyStake;
        }
      } else {
        recommendedBankroll += bet.result_profit || 0;
      }

      // AI Perfect: If they only took positive EV bets with Kelly stakes
      if (bet.model_ev_percentage && bet.model_ev_percentage > 0) {
        // This bet was AI recommended
        const stake = bet.kelly_stake_recommended || bet.stake;
        if (bet.status === 'won') {
          const profitRatio = (bet.result_profit || 0) / bet.stake;
          aiPerfectBankroll += stake * profitRatio;
        } else {
          aiPerfectBankroll -= stake;
        }
      }
      // If EV was negative, AI wouldn't have taken it - bankroll stays same

      points.push({
        date: format(new Date(bet.placed_at), 'MMM d'),
        actual: Math.max(0, actualBankroll),
        recommended: Math.max(0, recommendedBankroll),
        aiPerfect: Math.max(0, aiPerfectBankroll),
      });
    });

    return points;
  }, [sortedBets, startingBankroll]);

  // Final values
  const finalActual = timeline[timeline.length - 1]?.actual || startingBankroll;
  const finalRecommended = timeline[timeline.length - 1]?.recommended || startingBankroll;
  const finalAIPerfect = timeline[timeline.length - 1]?.aiPerfect || startingBankroll;

  const actualROI = ((finalActual - startingBankroll) / startingBankroll) * 100;
  const recommendedROI = ((finalRecommended - startingBankroll) / startingBankroll) * 100;
  const aiPerfectROI = ((finalAIPerfect - startingBankroll) / startingBankroll) * 100;

  const missedProfit = finalAIPerfect - finalActual;
  const stakingImpact = finalRecommended - finalActual;

  // Count bets that went against AI recommendations
  const antiAIBets = useMemo(() => 
    sortedBets.filter(b => (b.model_ev_percentage || 0) < 0),
    [sortedBets]
  );

  const proAIBets = useMemo(() => 
    sortedBets.filter(b => (b.model_ev_percentage || 0) > 0),
    [sortedBets]
  );

  if (sortedBets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No settled bets to analyze.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Place and settle bets to see what-if scenarios.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Your Actual Bankroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-3xl font-bold",
              finalActual >= startingBankroll ? "text-green-500" : "text-red-500"
            )}>
              ${finalActual.toFixed(0)}
            </p>
            <p className={cn(
              "text-sm",
              actualROI >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {actualROI >= 0 ? '+' : ''}{actualROI.toFixed(1)}% ROI
            </p>
            <Badge variant="outline" className="mt-2">Current Reality</Badge>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          finalRecommended > finalActual && "border-amber-500/50 bg-amber-500/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              If You Followed Stakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-3xl font-bold",
              finalRecommended >= startingBankroll ? "text-green-500" : "text-red-500"
            )}>
              ${finalRecommended.toFixed(0)}
            </p>
            <p className={cn(
              "text-sm",
              recommendedROI >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {recommendedROI >= 0 ? '+' : ''}{recommendedROI.toFixed(1)}% ROI
            </p>
            <Badge 
              variant={stakingImpact > 0 ? "success" : stakingImpact < 0 ? "destructive" : "outline"}
              className="mt-2"
            >
              {stakingImpact >= 0 ? '+' : ''}${stakingImpact.toFixed(0)} difference
            </Badge>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          finalAIPerfect > finalActual && "border-primary/50 bg-primary/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              If You Trusted AI 100%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-3xl font-bold",
              finalAIPerfect >= startingBankroll ? "text-green-500" : "text-red-500"
            )}>
              ${finalAIPerfect.toFixed(0)}
            </p>
            <p className={cn(
              "text-sm",
              aiPerfectROI >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {aiPerfectROI >= 0 ? '+' : ''}{aiPerfectROI.toFixed(1)}% ROI
            </p>
            <Badge 
              variant={missedProfit > 0 ? "success" : missedProfit < 0 ? "destructive" : "outline"}
              className="mt-2"
            >
              {missedProfit >= 0 ? '+' : ''}${missedProfit.toFixed(0)} potential
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Honest Assessment */}
      <Card className={cn(
        "border-l-4",
        missedProfit > 100 && "border-l-red-500 bg-red-500/5",
        missedProfit > 0 && missedProfit <= 100 && "border-l-amber-500 bg-amber-500/5",
        missedProfit <= 0 && "border-l-green-500 bg-green-500/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-full",
              missedProfit > 100 && "bg-red-500/20",
              missedProfit > 0 && missedProfit <= 100 && "bg-amber-500/20",
              missedProfit <= 0 && "bg-green-500/20"
            )}>
              {missedProfit > 100 ? (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              ) : missedProfit > 0 ? (
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              ) : (
                <Sparkles className="h-6 w-6 text-green-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">
                {missedProfit > 100 && "You're Leaving Money on the Table 💸"}
                {missedProfit > 0 && missedProfit <= 100 && "Room for Improvement 📈"}
                {missedProfit <= 0 && "Outperforming AI Recommendations! 🎯"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {missedProfit > 100 && (
                  <>
                    If you had followed all AI recommendations with proper staking, you'd have 
                    <span className="font-bold text-green-500"> ${missedProfit.toFixed(0)} more</span>.
                    That's a {((missedProfit / finalActual) * 100).toFixed(0)}% improvement.
                  </>
                )}
                {missedProfit > 0 && missedProfit <= 100 && (
                  <>
                    You're close to optimal. Following AI recommendations would have gained you 
                    <span className="font-bold text-amber-500"> ${missedProfit.toFixed(0)} more</span>.
                  </>
                )}
                {missedProfit <= 0 && (
                  <>
                    Your intuition has been paying off! You've outperformed pure AI recommendations by 
                    <span className="font-bold text-green-500"> ${Math.abs(missedProfit).toFixed(0)}</span>.
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Bankroll Timeline: Reality vs What-If
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground" 
                />
                <YAxis 
                  tickFormatter={(v) => `$${v}`}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(0)}`,
                    name === 'actual' ? 'Your Actual' : 
                    name === 'recommended' ? 'With Kelly Stakes' : 'AI Perfect'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="aiPerfect" 
                  name="AI Perfect"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.1)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area 
                  type="monotone" 
                  dataKey="recommended" 
                  name="With Kelly Stakes"
                  stroke="#f59e0b" 
                  fill="rgba(245, 158, 11, 0.1)"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  name="Your Actual"
                  stroke="#22c55e" 
                  fill="rgba(34, 197, 94, 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Your Actual Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-amber-500" style={{ width: 12 }} />
              <span>Kelly-Staked Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary" style={{ borderStyle: 'dashed', width: 12 }} />
              <span>AI-Perfect Path</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bet Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              AI-Aligned Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{proAIBets.length}</p>
            <p className="text-sm text-muted-foreground">
              Bets where you followed positive EV recommendations
            </p>
            <Progress 
              value={(proAIBets.length / sortedBets.length) * 100} 
              className="mt-3 h-2"
              variant="gold"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((proAIBets.length / sortedBets.length) * 100).toFixed(0)}% of total bets
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <TrendingDown className="h-4 w-4" />
              Against-AI Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{antiAIBets.length}</p>
            <p className="text-sm text-muted-foreground">
              Bets placed despite negative or no EV recommendation
            </p>
            <Progress 
              value={(antiAIBets.length / sortedBets.length) * 100} 
              className="mt-3 h-2 [&>div]:bg-red-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((antiAIBets.length / sortedBets.length) * 100).toFixed(0)}% of total bets
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default WhatIfAnalysis;
