import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Layers, Target } from "lucide-react";
import type { PerformanceByContext as ContextData } from "@/hooks/useAlgorithmComparison";

interface PerformanceByContextProps {
  performanceByContext: ContextData;
}

const ALGORITHM_COLORS: Record<string, string> = {
  'ML Power Index': 'hsl(var(--chart-1))',
  'Value Pick Finder': 'hsl(var(--chart-2))',
  'Statistical Edge': 'hsl(var(--chart-3))',
};

export function PerformanceByContext({ performanceByContext }: PerformanceByContextProps) {
  const [activeTab, setActiveTab] = useState('league');

  // Transform data for league chart
  const leagueChartData = performanceByContext.byLeague.slice(0, 8).map(league => {
    const result: Record<string, string | number> = { league: league.league };
    league.algorithms.forEach(alg => {
      result[alg.algorithmName] = Number(alg.winRate.toFixed(1));
    });
    return result;
  });

  // Transform data for confidence chart
  const confidenceChartData = performanceByContext.byConfidence.map(conf => {
    const result: Record<string, string | number> = { range: conf.range };
    conf.algorithms.forEach(alg => {
      result[alg.algorithmName] = Number(alg.winRate.toFixed(1));
    });
    return result;
  });

  // Get unique algorithm names
  const algorithmNames = new Set<string>();
  performanceByContext.byLeague.forEach(l => 
    l.algorithms.forEach(a => algorithmNames.add(a.algorithmName))
  );

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.fill }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5" />
          Performance by Context
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Find each algorithm's strengths by league and confidence level
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="league" className="gap-1">
              <Layers className="h-4 w-4" />
              By League
            </TabsTrigger>
            <TabsTrigger value="confidence" className="gap-1">
              <Target className="h-4 w-4" />
              By Confidence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="league">
            {leagueChartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leagueChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="league" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Array.from(algorithmNames).map((name) => (
                      <Bar 
                        key={name}
                        dataKey={name} 
                        fill={ALGORITHM_COLORS[name] || 'hsl(var(--primary))'} 
                        radius={[0, 4, 4, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No league data available</p>
            )}

            {/* League Leaders */}
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Best Algorithm by League</h4>
              <div className="flex flex-wrap gap-2">
                {performanceByContext.byLeague.slice(0, 6).map(league => {
                  const best = league.algorithms[0];
                  if (!best) return null;
                  return (
                    <Badge key={league.league} variant="outline" className="text-xs">
                      {league.league}: <span className="font-bold ml-1">{best.algorithmName.split(' ')[0]}</span>
                      <span className="text-muted-foreground ml-1">({best.winRate.toFixed(0)}%)</span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="confidence">
            {confidenceChartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="range" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Array.from(algorithmNames).map((name) => (
                      <Bar 
                        key={name}
                        dataKey={name} 
                        fill={ALGORITHM_COLORS[name] || 'hsl(var(--primary))'} 
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No confidence data available</p>
            )}

            {/* Insight */}
            <p className="text-xs text-muted-foreground mt-4">
              💡 Higher confidence picks should generally have higher win rates. Look for algorithms that show strong correlation.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
