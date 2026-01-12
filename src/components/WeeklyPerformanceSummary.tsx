import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBetSlip } from '@/components/BetSlip/BetSlipContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  getWeekBets,
  calculateWeeklyStats,
  getBestPicks,
  getLeagueBreakdown,
  getBetTypeBreakdown,
  getOddsRangeBreakdown,
  getDayBreakdown,
  generateInsights,
  WeeklyStats,
  Insight,
} from '@/utils/betting/performanceAnalyzer';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  profit: { label: 'Profit', color: 'hsl(var(--primary))' },
  cumulative: { label: 'Cumulative', color: 'hsl(var(--primary))' },
  wins: { label: 'Wins', color: 'hsl(142.1 76.2% 36.3%)' },
  losses: { label: 'Losses', color: 'hsl(0 84.2% 60.2%)' },
};

export default function WeeklyPerformanceSummary() {
  const { bets: realBets, isLoading } = useBetSlip();
  const [weekOffset, setWeekOffset] = useState(0);

  // Only use real bets - no mock data
  const allBets = useMemo(() => realBets, [realBets]);

  const currentWeekBets = useMemo(() => getWeekBets(allBets, weekOffset), [allBets, weekOffset]);
  const lastWeekBets = useMemo(() => getWeekBets(allBets, weekOffset + 1), [allBets, weekOffset]);

  const currentStats = useMemo(() => calculateWeeklyStats(currentWeekBets), [currentWeekBets]);
  const lastStats = useMemo(() => calculateWeeklyStats(lastWeekBets), [lastWeekBets]);

  const bestPicks = useMemo(() => getBestPicks(currentWeekBets, 3), [currentWeekBets]);
  const insights = useMemo(() => generateInsights(currentWeekBets, currentStats), [currentWeekBets, currentStats]);

  const leagueBreakdown = useMemo(() => getLeagueBreakdown(currentWeekBets), [currentWeekBets]);
  const betTypeBreakdown = useMemo(() => getBetTypeBreakdown(currentWeekBets), [currentWeekBets]);
  const oddsRangeBreakdown = useMemo(() => getOddsRangeBreakdown(currentWeekBets), [currentWeekBets]);
  const dayBreakdown = useMemo(() => getDayBreakdown(currentWeekBets), [currentWeekBets]);

  const weekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const StatChange = ({ current, previous, suffix = '', invert = false }: { 
    current: number; 
    previous: number; 
    suffix?: string;
    invert?: boolean;
  }) => {
    const diff = current - previous;
    const isPositive = invert ? diff < 0 : diff > 0;
    if (Math.abs(diff) < 0.01) return null;

    return (
      <span className={`text-xs flex items-center gap-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}{suffix}
      </span>
    );
  };

  const InsightIcon = ({ type }: { type: Insight['type'] }) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'tip': return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show empty state if no bets exist
  if (allBets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Bets Placed Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Start tracking your bets to see weekly performance summaries, insights, and identify your best picks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm min-w-[180px] text-center">{weekLabel}</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {weekOffset === 0 && (
          <Badge variant="secondary">Current Week</Badge>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Bets</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{currentStats.totalBets}</span>
                <StatChange current={currentStats.totalBets} previous={lastStats.totalBets} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Win Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{currentStats.winRate.toFixed(1)}%</span>
                <StatChange current={currentStats.winRate} previous={lastStats.winRate} suffix="%" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Profit/Loss</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${currentStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {currentStats.totalProfit >= 0 ? '+' : ''}${currentStats.totalProfit.toFixed(2)}
                </span>
                <StatChange current={currentStats.totalProfit} previous={lastStats.totalProfit} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">ROI</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${currentStats.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {currentStats.roi >= 0 ? '+' : ''}{currentStats.roi.toFixed(1)}%
                </span>
                <StatChange current={currentStats.roi} previous={lastStats.roi} suffix="%" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Avg CLV</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${currentStats.avgCLV >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {currentStats.avgCLV >= 0 ? '+' : ''}{currentStats.avgCLV.toFixed(1)}%
                </span>
                <StatChange current={currentStats.avgCLV} previous={lastStats.avgCLV} suffix="%" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Daily Profit Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStats.dailyProfits.some(d => d.profit !== 0) ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer>
                <AreaChart data={currentStats.dailyProfits}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#profitGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No settled bets this week
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Best Picks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Best Picks This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestPicks.length > 0 ? (
              <div className="space-y-3">
                {bestPicks.map(({ bet, rank, highlights }) => (
                  <div key={bet.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{bet.match_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {bet.selection} @ {bet.odds_at_placement.toFixed(2)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {highlights.map((h) => (
                          <Badge key={h} variant="outline" className="text-[10px] py-0">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-green-500 font-bold text-sm">
                        +${(bet.result_profit || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No winning bets this week yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Improvement Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      insight.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                      insight.type === 'success' ? 'border-green-500/30 bg-green-500/5' :
                      'border-blue-500/30 bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <InsightIcon type={insight.type} />
                      <div>
                        <p className="font-medium text-sm">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Not enough data for insights yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="league" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="league">League</TabsTrigger>
              <TabsTrigger value="type">Bet Type</TabsTrigger>
              <TabsTrigger value="odds">Odds</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>

            <TabsContent value="league" className="mt-4">
              {leagueBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {leagueBreakdown.map((l) => (
                    <div key={l.league} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium text-sm">{l.league}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {l.wins}-{l.losses} ({l.winRate.toFixed(0)}%)
                        </span>
                      </div>
                      <span className={`font-medium text-sm ${l.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {l.profit >= 0 ? '+' : ''}${l.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">No data available</p>
              )}
            </TabsContent>

            <TabsContent value="type" className="mt-4">
              {betTypeBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {betTypeBreakdown.map((t) => (
                    <div key={t.betType} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium text-sm capitalize">{t.betType}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {t.wins}-{t.losses} ({t.winRate.toFixed(0)}%)
                        </span>
                      </div>
                      <span className={`font-medium text-sm ${t.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {t.profit >= 0 ? '+' : ''}${t.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">No data available</p>
              )}
            </TabsContent>

            <TabsContent value="odds" className="mt-4">
              {oddsRangeBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {oddsRangeBreakdown.map((o) => (
                    <div key={o.range} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium text-sm">{o.range}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {o.wins}-{o.losses} ({o.winRate.toFixed(0)}%)
                        </span>
                      </div>
                      <span className={`font-medium text-sm ${o.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {o.profit >= 0 ? '+' : ''}${o.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">No data available</p>
              )}
            </TabsContent>

            <TabsContent value="day" className="mt-4">
              {dayBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {dayBreakdown.map((d) => (
                    <div key={d.day} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium text-sm">{d.day}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {d.wins}-{d.losses} ({d.winRate.toFixed(0)}%)
                        </span>
                      </div>
                      <span className={`font-medium text-sm ${d.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {d.profit >= 0 ? '+' : ''}${d.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">No data available</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Week Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Week-over-Week Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Metric</th>
                  <th className="text-right py-2 font-medium">This Week</th>
                  <th className="text-right py-2 font-medium">Last Week</th>
                  <th className="text-right py-2 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Bets</td>
                  <td className="text-right py-2">{currentStats.totalBets}</td>
                  <td className="text-right py-2 text-muted-foreground">{lastStats.totalBets}</td>
                  <td className="text-right py-2">
                    <StatChange current={currentStats.totalBets} previous={lastStats.totalBets} />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Wins</td>
                  <td className="text-right py-2">{currentStats.wins}</td>
                  <td className="text-right py-2 text-muted-foreground">{lastStats.wins}</td>
                  <td className="text-right py-2">
                    <StatChange current={currentStats.wins} previous={lastStats.wins} />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Win Rate</td>
                  <td className="text-right py-2">{currentStats.winRate.toFixed(1)}%</td>
                  <td className="text-right py-2 text-muted-foreground">{lastStats.winRate.toFixed(1)}%</td>
                  <td className="text-right py-2">
                    <StatChange current={currentStats.winRate} previous={lastStats.winRate} suffix="%" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Profit</td>
                  <td className={`text-right py-2 ${currentStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${currentStats.totalProfit.toFixed(2)}
                  </td>
                  <td className={`text-right py-2 text-muted-foreground`}>
                    ${lastStats.totalProfit.toFixed(2)}
                  </td>
                  <td className="text-right py-2">
                    <StatChange current={currentStats.totalProfit} previous={lastStats.totalProfit} />
                  </td>
                </tr>
                <tr>
                  <td className="py-2">Avg Stake</td>
                  <td className="text-right py-2">
                    ${currentStats.totalBets > 0 ? (currentStats.totalStaked / currentStats.totalBets).toFixed(2) : '0.00'}
                  </td>
                  <td className="text-right py-2 text-muted-foreground">
                    ${lastStats.totalBets > 0 ? (lastStats.totalStaked / lastStats.totalBets).toFixed(2) : '0.00'}
                  </td>
                  <td className="text-right py-2">
                    <StatChange 
                      current={currentStats.totalBets > 0 ? currentStats.totalStaked / currentStats.totalBets : 0} 
                      previous={lastStats.totalBets > 0 ? lastStats.totalStaked / lastStats.totalBets : 0} 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
