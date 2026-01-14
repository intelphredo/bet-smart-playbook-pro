/**
 * Risk Exposure Dashboard - Shows current exposure across open bets
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserBet } from '@/types/betting';
import { calculateRiskExposure } from '@/utils/riskManagement/exposureCalculator';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RiskExposureDashboardProps {
  openBets: UserBet[];
  bankroll: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function RiskExposureDashboard({ openBets, bankroll }: RiskExposureDashboardProps) {
  const exposure = useMemo(() => 
    calculateRiskExposure(openBets, { bankroll }),
    [openBets, bankroll]
  );
  
  const exposurePercent = (exposure.totalExposure / bankroll) * 100;
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500 bg-green-500/10';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'critical': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground';
    }
  };
  
  const leagueChartData = Object.entries(exposure.exposureByLeague).map(([name, data]) => ({
    name,
    value: data.amount,
    percentage: data.percentage,
  }));
  
  return (
    <div className="space-y-4">
      {/* Exposure Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Exposure</p>
                <p className="text-xl font-bold">${exposure.totalExposure.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">% of Bankroll</p>
                <p className="text-xl font-bold">{exposurePercent.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Open Bets</p>
                <p className="text-xl font-bold">{exposure.openBetsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className={cn("h-4 w-4", getRiskColor(exposure.riskLevel).split(' ')[0])} />
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <Badge className={cn("text-xs", getRiskColor(exposure.riskLevel))}>
                  {exposure.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Warnings */}
      {exposure.warnings.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Exposure Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {exposure.warnings.map((warning, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-sm",
                  warning.severity === 'danger' ? 'bg-red-500/10' : 'bg-orange-500/10'
                )}
              >
                <span>{warning.message}</span>
                <Badge variant={warning.severity === 'danger' ? 'destructive' : 'outline'}>
                  {warning.value.toFixed(1)}% / {warning.threshold}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* League Exposure Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Exposure by League</CardTitle>
          </CardHeader>
          <CardContent>
            {leagueChartData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={leagueChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                    >
                      {leagueChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Exposure']} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No open bets</p>
            )}
          </CardContent>
        </Card>
        
        {/* Bet Type Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Exposure by Bet Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(exposure.exposureByBetType).map(([type, data]) => (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{type}</span>
                  <span className="text-muted-foreground">
                    ${data.amount.toFixed(2)} ({data.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={data.percentage} className="h-2" />
              </div>
            ))}
            {Object.keys(exposure.exposureByBetType).length === 0 && (
              <p className="text-center text-muted-foreground py-4">No open bets</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Largest Bet Warning */}
      {exposure.largestSingleBet && exposure.largestSingleBet.percentage > 3 && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  Largest single bet: <strong>{exposure.largestSingleBet.matchTitle}</strong>
                </span>
              </div>
              <Badge variant="outline">
                ${exposure.largestSingleBet.amount.toFixed(2)} ({exposure.largestSingleBet.percentage.toFixed(1)}%)
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
