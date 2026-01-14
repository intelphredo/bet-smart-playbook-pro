/**
 * Withdrawal Scheduler - Recommends sustainable withdrawal amounts
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Wallet, ArrowUpCircle, Shield, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateWithdrawalRecommendation } from '@/utils/riskManagement/exposureCalculator';

interface WithdrawalSchedulerProps {
  currentBankroll: number;
  startingBankroll: number;
  currentROI: number;
}

export function WithdrawalScheduler({
  currentBankroll,
  startingBankroll,
  currentROI,
}: WithdrawalSchedulerProps) {
  const [monthlyTarget, setMonthlyTarget] = useState(500);
  const [expectedEdge, setExpectedEdge] = useState(3);
  
  const recommendation = useMemo(() => 
    calculateWithdrawalRecommendation(
      currentBankroll,
      startingBankroll,
      monthlyTarget,
      expectedEdge / 100,
      currentROI
    ),
    [currentBankroll, startingBankroll, monthlyTarget, expectedEdge, currentROI]
  );
  
  const profit = currentBankroll - startingBankroll;
  const profitPercent = ((profit / startingBankroll) * 100);
  
  const getSustainabilityColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className="space-y-4">
      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Withdrawal Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Monthly Income Target ($)</Label>
              <Input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Expected Edge (%)</Label>
              <Input
                type="number"
                value={expectedEdge}
                onChange={(e) => setExpectedEdge(Number(e.target.value))}
                min={0}
                max={20}
                step={0.5}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Status */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Current Profit</p>
            <p className={cn(
              "text-xl font-bold",
              profit >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Protected Bankroll</p>
            <p className="text-xl font-bold">${recommendation.protectedBankroll.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Never go below</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Growth Reserve</p>
            <p className="text-xl font-bold text-blue-500">
              ${recommendation.growthReserve.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">For compounding</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
            Withdrawal Recommendations
          </CardTitle>
          <CardDescription className="text-xs">
            Based on your current performance and sustainability goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sustainability Score */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className={cn("h-5 w-5", getSustainabilityColor(recommendation.sustainabilityScore))} />
              <span className="text-sm font-medium">Sustainability Score</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={recommendation.sustainabilityScore} 
                className="w-24 h-2"
              />
              <span className={cn("font-bold", getSustainabilityColor(recommendation.sustainabilityScore))}>
                {recommendation.sustainabilityScore}
              </span>
            </div>
          </div>
          
          {/* Withdrawal Options */}
          <div className="grid grid-cols-3 gap-3">
            <div className={cn(
              "p-3 rounded-lg border text-center",
              "bg-green-500/5 border-green-500/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1">Safe</p>
              <p className="text-lg font-bold text-green-500">
                ${recommendation.safeAmount.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Low risk</p>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg border text-center ring-2 ring-primary",
              "bg-primary/5 border-primary/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1">Recommended</p>
              <p className="text-lg font-bold text-primary">
                ${recommendation.recommendedAmount.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Balanced</p>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg border text-center",
              "bg-orange-500/5 border-orange-500/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1">Aggressive</p>
              <p className="text-lg font-bold text-orange-500">
                ${recommendation.aggressiveAmount.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Higher risk</p>
            </div>
          </div>
          
          {/* Reasoning */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              {recommendation.recommendedAmount >= monthlyTarget ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              )}
              <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
            </div>
          </div>
          
          {profit <= 0 && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-500">
                  Not recommended to withdraw while bankroll is at or below starting amount.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
