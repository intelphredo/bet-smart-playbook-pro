import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { History, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { useBetTracking } from "@/hooks/useBetTracking";
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from "date-fns";

interface BankrollHistoryChartProps {
  startingBankroll: number;
}

interface DailyData {
  date: string;
  dateLabel: string;
  bankroll: number;
  dailyProfit: number;
  betsSettled: number;
  wins: number;
  losses: number;
}

export function BankrollHistoryChart({ startingBankroll }: BankrollHistoryChartProps) {
  const { bets, isLoading } = useBetTracking();
  
  const historyData = useMemo(() => {
    // Get settled bets only
    const settledBets = bets.filter(b => 
      b.status === 'won' || b.status === 'lost' || b.status === 'push'
    ).sort((a, b) => {
      const dateA = a.settled_at || a.created_at || '';
      const dateB = b.settled_at || b.created_at || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    
    if (settledBets.length === 0) {
      return [];
    }
    
    // Get date range
    const firstBetDate = settledBets[0]?.settled_at || settledBets[0]?.created_at;
    const lastBetDate = settledBets[settledBets.length - 1]?.settled_at || 
                        settledBets[settledBets.length - 1]?.created_at;
    
    if (!firstBetDate || !lastBetDate) return [];
    
    const startDate = startOfDay(parseISO(firstBetDate));
    const endDate = startOfDay(new Date());
    
    // Generate all days in range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group bets by day
    const betsByDay = new Map<string, typeof settledBets>();
    settledBets.forEach(bet => {
      const betDate = bet.settled_at || bet.created_at;
      if (!betDate) return;
      const dayKey = format(startOfDay(parseISO(betDate)), 'yyyy-MM-dd');
      const existing = betsByDay.get(dayKey) || [];
      existing.push(bet);
      betsByDay.set(dayKey, existing);
    });
    
    // Build cumulative data
    let runningBankroll = startingBankroll;
    const data: DailyData[] = [];
    
    allDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayBets = betsByDay.get(dayKey) || [];
      
      let dailyProfit = 0;
      let wins = 0;
      let losses = 0;
      
      dayBets.forEach(bet => {
        const profit = bet.result_profit || 0;
        dailyProfit += profit;
        if (bet.status === 'won') wins++;
        if (bet.status === 'lost') losses++;
      });
      
      runningBankroll += dailyProfit;
      
      data.push({
        date: dayKey,
        dateLabel: format(day, 'MMM d'),
        bankroll: Math.round(runningBankroll * 100) / 100,
        dailyProfit: Math.round(dailyProfit * 100) / 100,
        betsSettled: dayBets.length,
        wins,
        losses,
      });
    });
    
    return data;
  }, [bets, startingBankroll]);
  
  const stats = useMemo(() => {
    if (historyData.length === 0) {
      return {
        currentBankroll: startingBankroll,
        totalProfit: 0,
        profitPercent: 0,
        highestBankroll: startingBankroll,
        lowestBankroll: startingBankroll,
        bestDay: null as DailyData | null,
        worstDay: null as DailyData | null,
        totalBets: 0,
        winningDays: 0,
        losingDays: 0,
      };
    }
    
    const currentBankroll = historyData[historyData.length - 1].bankroll;
    const totalProfit = currentBankroll - startingBankroll;
    const profitPercent = (totalProfit / startingBankroll) * 100;
    
    const highestBankroll = Math.max(...historyData.map(d => d.bankroll));
    const lowestBankroll = Math.min(...historyData.map(d => d.bankroll));
    
    const daysWithBets = historyData.filter(d => d.betsSettled > 0);
    const bestDay = daysWithBets.length > 0 
      ? daysWithBets.reduce((best, d) => d.dailyProfit > best.dailyProfit ? d : best, daysWithBets[0])
      : null;
    const worstDay = daysWithBets.length > 0
      ? daysWithBets.reduce((worst, d) => d.dailyProfit < worst.dailyProfit ? d : worst, daysWithBets[0])
      : null;
    
    const totalBets = historyData.reduce((sum, d) => sum + d.betsSettled, 0);
    const winningDays = daysWithBets.filter(d => d.dailyProfit > 0).length;
    const losingDays = daysWithBets.filter(d => d.dailyProfit < 0).length;
    
    return {
      currentBankroll,
      totalProfit,
      profitPercent,
      highestBankroll,
      lowestBankroll,
      bestDay,
      worstDay,
      totalBets,
      winningDays,
      losingDays,
    };
  }, [historyData, startingBankroll]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (historyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bankroll History
          </CardTitle>
          <CardDescription>
            Track your bankroll changes over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Betting History Yet</p>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Once you have settled bets, your bankroll history will appear here showing 
              how your balance has changed over time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bankroll History
          </CardTitle>
          <CardDescription>
            Actual bankroll changes based on {stats.totalBets} settled bets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Current Bankroll</p>
              <p className="text-lg font-bold">${stats.currentBankroll.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Profit/Loss</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${
                stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stats.totalProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className={`text-lg font-bold ${
                stats.profitPercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stats.profitPercent >= 0 ? '+' : ''}{stats.profitPercent.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Winning/Losing Days</p>
              <p className="text-lg font-bold">
                <span className="text-green-500">{stats.winningDays}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-red-500">{stats.losingDays}</span>
              </p>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'bankroll') return [`$${value.toLocaleString()}`, 'Bankroll'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const data = payload[0].payload as DailyData;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Bankroll:</span>{' '}
                            <span className="font-medium">${data.bankroll.toLocaleString()}</span>
                          </p>
                          {data.betsSettled > 0 && (
                            <>
                              <p className={data.dailyProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                <span className="text-muted-foreground">Day P/L:</span>{' '}
                                <span className="font-medium">
                                  {data.dailyProfit >= 0 ? '+' : ''}${data.dailyProfit.toFixed(2)}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Bets:</span>{' '}
                                <span className="text-green-500">{data.wins}W</span>
                                <span className="mx-1">/</span>
                                <span className="text-red-500">{data.losses}L</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine 
                  y={startingBankroll} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Starting', 
                    position: 'left',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="bankroll" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#bankrollGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Best/Worst Days */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Best Day</p>
                {stats.bestDay ? (
                  <>
                    <p className="text-xl font-bold text-green-500">
                      +${stats.bestDay.dailyProfit.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(stats.bestDay.date), 'MMM d, yyyy')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stats.bestDay.wins}W / {stats.bestDay.losses}L
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Worst Day</p>
                {stats.worstDay ? (
                  <>
                    <p className="text-xl font-bold text-red-500">
                      ${stats.worstDay.dailyProfit.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(stats.worstDay.date), 'MMM d, yyyy')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stats.worstDay.wins}W / {stats.worstDay.losses}L
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Peak Bankroll</p>
              <p className="text-lg font-bold text-green-500">
                ${stats.highestBankroll.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lowest Bankroll</p>
              <p className="text-lg font-bold text-red-500">
                ${stats.lowestBankroll.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
              <p className="text-lg font-bold text-orange-400">
                ${(stats.highestBankroll - stats.lowestBankroll).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Days Tracked</p>
              <p className="text-lg font-bold">{historyData.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
