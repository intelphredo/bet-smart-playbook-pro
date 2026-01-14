import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface ConsensusChartProps {
  agreementStats: {
    fullAgreement: number;
    partialAgreement: number;
    noAgreement: number;
    fullAgreementWinRate: number;
    partialAgreementWinRate: number;
    noAgreementWinRate: number;
  };
}

export function ConsensusChart({ agreementStats }: ConsensusChartProps) {
  const total = agreementStats.fullAgreement + agreementStats.partialAgreement + agreementStats.noAgreement;
  
  const chartData = [
    { 
      name: 'Full Agreement', 
      value: agreementStats.fullAgreement,
      winRate: agreementStats.fullAgreementWinRate,
      color: 'hsl(var(--chart-1))',
    },
    { 
      name: 'Partial Agreement', 
      value: agreementStats.partialAgreement,
      winRate: agreementStats.partialAgreementWinRate,
      color: 'hsl(var(--chart-2))',
    },
    { 
      name: 'Split Decision', 
      value: agreementStats.noAgreement,
      winRate: agreementStats.noAgreementWinRate,
      color: 'hsl(var(--chart-3))',
    },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} matches ({((data.value / total) * 100).toFixed(0)}%)</p>
          <p className="text-sm font-medium mt-1">
            Win Rate: <span className={cn(
              data.winRate >= 55 ? "text-green-500" : 
              data.winRate >= 50 ? "text-yellow-500" : "text-red-500"
            )}>{data.winRate.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Consensus Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Do algorithms perform better when they agree?
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[200px]">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No consensus data available
              </div>
            )}
          </div>

          {/* Win Rate Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Win Rate by Agreement Level</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Full Agreement (All 3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {agreementStats.fullAgreement} picks
                  </Badge>
                  <span className={cn(
                    "font-bold",
                    agreementStats.fullAgreementWinRate >= 55 ? "text-green-500" :
                    agreementStats.fullAgreementWinRate >= 50 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {agreementStats.fullAgreementWinRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Partial Agreement (2 of 3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {agreementStats.partialAgreement} picks
                  </Badge>
                  <span className={cn(
                    "font-bold",
                    agreementStats.partialAgreementWinRate >= 55 ? "text-green-500" :
                    agreementStats.partialAgreementWinRate >= 50 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {agreementStats.partialAgreementWinRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Split Decision</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {agreementStats.noAgreement} picks
                  </Badge>
                  <span className={cn(
                    "font-bold",
                    agreementStats.noAgreementWinRate >= 55 ? "text-green-500" :
                    agreementStats.noAgreementWinRate >= 50 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {agreementStats.noAgreementWinRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {agreementStats.fullAgreementWinRate > agreementStats.noAgreementWinRate && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                💡 Consensus picks perform {(agreementStats.fullAgreementWinRate - agreementStats.noAgreementWinRate).toFixed(1)}% better than split decisions!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
