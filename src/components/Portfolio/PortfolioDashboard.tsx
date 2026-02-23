import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign, TrendingUp, TrendingDown, Target, Percent,
  BarChart3, Trophy, Zap, PieChart
} from 'lucide-react';
import { UserBet, UserBettingStats } from '@/types/betting';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PortfolioDashboardProps {
  bets: UserBet[];
  stats: UserBettingStats | null;
}

export default function PortfolioDashboard({ bets, stats }: PortfolioDashboardProps) {
  // ROI over time data
  const roiChartData = useMemo(() => {
    const sorted = [...bets]
      .filter(b => b.status !== 'pending' && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());

    let cumProfit = 0;
    let cumStaked = 0;
    const data: { date: string; profit: number; roi: number; label: string }[] = [];

    sorted.forEach(bet => {
      cumProfit += bet.result_profit || 0;
      cumStaked += bet.stake;
      data.push({
        date: format(parseISO(bet.placed_at), 'MMM d'),
        label: format(parseISO(bet.placed_at), 'MMM d, yyyy'),
        profit: parseFloat(cumProfit.toFixed(2)),
        roi: cumStaked > 0 ? parseFloat(((cumProfit / cumStaked) * 100).toFixed(1)) : 0,
      });
    });

    return data;
  }, [bets]);

  // Win rate by league
  const leagueBreakdown = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number; pushes: number; profit: number; staked: number }>();
    bets.forEach(b => {
      if (b.status === 'pending' || b.status === 'cancelled') return;
      const league = b.league || 'Other';
      const entry = map.get(league) || { wins: 0, losses: 0, pushes: 0, profit: 0, staked: 0 };
      if (b.status === 'won') entry.wins++;
      else if (b.status === 'lost') entry.losses++;
      else if (b.status === 'push') entry.pushes++;
      entry.profit += b.result_profit || 0;
      entry.staked += b.stake;
      map.set(league, entry);
    });
    return Array.from(map.entries())
      .map(([league, d]) => ({
        league,
        ...d,
        total: d.wins + d.losses,
        winRate: (d.wins + d.losses) > 0 ? (d.wins / (d.wins + d.losses)) * 100 : 0,
        roi: d.staked > 0 ? (d.profit / d.staked) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [bets]);

  // Win rate by bet type
  const typeBreakdown = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number; profit: number; staked: number }>();
    bets.forEach(b => {
      if (b.status === 'pending' || b.status === 'cancelled') return;
      const entry = map.get(b.bet_type) || { wins: 0, losses: 0, profit: 0, staked: 0 };
      if (b.status === 'won') entry.wins++;
      else if (b.status === 'lost') entry.losses++;
      entry.profit += b.result_profit || 0;
      entry.staked += b.stake;
      map.set(b.bet_type, entry);
    });
    return Array.from(map.entries()).map(([type, d]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      ...d,
      total: d.wins + d.losses,
      winRate: (d.wins + d.losses) > 0 ? (d.wins / (d.wins + d.losses)) * 100 : 0,
    }));
  }, [bets]);

  const totalWagered = stats?.total_staked || 0;
  const totalProfit = stats?.total_profit || 0;
  const roi = stats?.roi_percentage || 0;
  const settled = (stats?.wins || 0) + (stats?.losses || 0);
  const winRate = settled > 0 ? ((stats?.wins || 0) / settled) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">${totalWagered.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">Total Wagered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-gradient-to-br border",
          totalProfit >= 0
            ? "from-green-500/10 to-green-500/5 border-green-500/20"
            : "from-red-500/10 to-red-500/5 border-red-500/20"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {totalProfit >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
              <div>
                <p className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-green-500" : "text-red-500")}>
                  {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  P&L ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate ({stats?.wins || 0}W-{stats?.losses || 0}L)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {stats?.current_streak || 0}
                  <span className="text-sm text-muted-foreground ml-1">
                    {(stats?.current_streak || 0) > 0 ? '🔥' : ''}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Current Streak (Best: {stats?.best_streak || 0})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Chart */}
      {roiChartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              P&L Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiChartData}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
                    labelFormatter={(label) => label}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--primary))"
                    fill="url(#profitGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* By League */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Win Rate by League
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leagueBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No settled bets yet</p>
            ) : (
              leagueBreakdown.map(l => (
                <div key={l.league} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{l.league}</Badge>
                      <span className="text-muted-foreground">{l.wins}W-{l.losses}L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{l.winRate.toFixed(0)}%</span>
                      <span className={cn("text-xs font-medium", l.profit >= 0 ? "text-green-500" : "text-red-500")}>
                        {l.profit >= 0 ? '+' : ''}{l.roi.toFixed(0)}% ROI
                      </span>
                    </div>
                  </div>
                  <Progress value={Math.min(100, l.winRate)} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* By Bet Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4 text-primary" />
              Win Rate by Bet Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No settled bets yet</p>
            ) : (
              typeBreakdown.map(t => (
                <div key={t.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{t.type}</Badge>
                      <span className="text-muted-foreground">{t.wins}W-{t.losses}L</span>
                    </div>
                    <span className="font-medium">{t.winRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(100, t.winRate)} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sportsbook Breakdown */}
      {bets.length > 0 && (
        <SportsBookBreakdown bets={bets} />
      )}
    </div>
  );
}

function SportsBookBreakdown({ bets }: { bets: UserBet[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { count: number; profit: number }>();
    bets.forEach(b => {
      if (b.status === 'pending' || b.status === 'cancelled') return;
      const book = b.sportsbook || 'Unknown';
      const entry = map.get(book) || { count: 0, profit: 0 };
      entry.count++;
      entry.profit += b.result_profit || 0;
      map.set(book, entry);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count);
  }, [bets]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          P&L by Sportsbook
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
              />
              <Bar
                dataKey="profit"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
