import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PiggyBank, TrendingUp, Lock, Filter, Calendar,
  ArrowLeft, Target, Zap, ChevronDown, Scan
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NavBar from '@/components/NavBar';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import PageFooter from '@/components/PageFooter';
import { useSavings, SavingsTransaction } from '@/hooks/useSavings';
import { useAuth } from '@/hooks/useAuth';
import { SavingsGoalSection } from '@/components/Savings/SavingsGoalSection';
import { BetSlipScanner } from '@/components/Savings/BetSlipScanner';
import { cn } from '@/lib/utils';
import { format, parseISO, subDays, startOfDay } from 'date-fns';

// ─── helpers ────────────────────────────────────────────────────────────────
function fmt(v: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(v);
}

const LEAGUE_COLORS: Record<string, string> = {
  NBA:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NFL:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MLB:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NHL:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  SOCCER: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

type DateRange = '7d' | '30d' | '90d' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All time',
};

// Build cumulative balance chart data from transactions (oldest→newest)
function buildChartData(transactions: SavingsTransaction[], range: DateRange) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const cutoff = range === 'all' ? null : startOfDay(subDays(new Date(), range === '7d' ? 7 : range === '30d' ? 30 : 90));
  const filtered = cutoff ? sorted.filter(t => new Date(t.created_at) >= cutoff) : sorted;

  let running = 0;
  // Seed with the balance before the window
  if (cutoff) {
    sorted
      .filter(t => new Date(t.created_at) < cutoff)
      .forEach(t => { running += t.amount; });
  }

  return filtered.map(t => {
    running += t.amount;
    return {
      date: format(parseISO(t.created_at), 'MMM d'),
      balance: parseFloat(running.toFixed(2)),
      amount: t.amount,
      league: t.league || 'Other',
    };
  });
}

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-primary">{fmt(payload[0]?.value ?? 0)}</p>
      {payload[0]?.payload?.amount && (
        <p className="text-muted-foreground">+{fmt(payload[0].payload.amount)} saved</p>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function SavingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { account, transactions, isLoading, isSaving, updateSavingsGoal } = useSavings();

  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Collect all unique leagues from transactions
  const leagues = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { if (t.league) s.add(t.league); });
    return Array.from(s).sort();
  }, [transactions]);

  // Filtered transactions for the history list
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (leagueFilter !== 'all') list = list.filter(t => t.league === leagueFilter);
    if (dateRange !== 'all') {
      const cutoff = startOfDay(subDays(new Date(), dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90));
      list = list.filter(t => new Date(t.created_at) >= cutoff);
    }
    return list;
  }, [transactions, leagueFilter, dateRange]);

  // Chart data (always uses all leagues, just filtered by date range)
  const chartData = useMemo(() => buildChartData(transactions, dateRange), [transactions, dateRange]);

  // Stats
  const balance    = account?.balance ?? 0;
  const totalSaved = account?.total_contributed ?? 0;
  const totalBets  = account?.total_saved_from_bets ?? 0;
  const avgPerBet  = totalBets > 0 ? totalSaved / totalBets : 0;
  const biggestContrib = transactions.length
    ? Math.max(...transactions.map(t => t.amount))
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Sign in to view your savings vault.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <AppBreadcrumb />

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Bet Savings Vault</h1>
              <p className="text-xs text-muted-foreground">
                {account?.is_active ? `${account.savings_rate}% auto-saved on every wager` : 'Savings paused'}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", account?.is_active ? "border-primary/40 text-primary" : "border-border text-muted-foreground")}
            >
              {account?.is_active ? 'Active' : 'Paused'}
            </Badge>
            <Button
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setScannerOpen(true)}
            >
              <Scan className="h-3.5 w-3.5" />
              Scan Bet Slip
            </Button>
          </div>
        </motion.div>

        {/* Bet Slip Scanner Modal */}
        <BetSlipScanner open={scannerOpen} onOpenChange={setScannerOpen} />

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Vault Balance', value: fmt(balance), icon: PiggyBank, highlight: true },
            { label: 'Total Saved', value: fmt(totalSaved), icon: TrendingUp },
            { label: 'Avg / Bet', value: fmt(avgPerBet), icon: Zap },
            { label: 'Biggest Save', value: fmt(biggestContrib), icon: Target },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <Card key={label} className={cn("border", highlight ? "border-primary/30 bg-primary/5" : "border-border/40 bg-card/60")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-3.5 w-3.5", highlight ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className={cn("text-lg font-bold", highlight && "text-primary")}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Savings goal */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <SavingsGoalSection
            balance={balance}
            goal={account?.savings_goal ?? null}
            celebrated={account?.milestones_celebrated ?? []}
            isSaving={isSaving}
            onSetGoal={updateSavingsGoal}
          />
        </motion.div>

        {/* Balance growth chart */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border border-border/40 bg-card/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Vault Balance Growth
                </CardTitle>
                <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map(k => (
                      <SelectItem key={k} value={k} className="text-xs">{DATE_RANGE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {chartData.length < 2 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <TrendingUp className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Place bets to see your vault grow</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="vaultGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `$${v}`}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    {account?.savings_goal && (
                      <ReferenceLine
                        y={account.savings_goal}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="4 4"
                        opacity={0.5}
                        label={{ value: 'Goal', position: 'right', fontSize: 10, fill: 'hsl(var(--primary))' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#vaultGradient)"
                      dot={chartData.length <= 15 ? { r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 } : false}
                      activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction history */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border border-border/40 bg-card/60">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 flex-1">
                  <Lock className="h-4 w-4 text-primary" />
                  Contribution History
                  {filteredTransactions.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {filteredTransactions.length}
                    </Badge>
                  )}
                </CardTitle>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue placeholder="League" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Leagues</SelectItem>
                      {leagues.map(l => (
                        <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                  <PiggyBank className="h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    {transactions.length === 0
                      ? 'No contributions yet — place a bet to start saving!'
                      : 'No transactions match the current filters.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <Lock className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px] sm:max-w-xs">
                            {tx.match_title || 'Bet contribution'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {format(parseISO(tx.created_at), 'MMM d, h:mm a')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {tx.savings_rate_applied}% of {fmt(tx.original_stake)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-primary">+{fmt(tx.amount)}</p>
                        {tx.league ? (
                          <Badge className={cn("text-[9px] h-4 px-1 border", LEAGUE_COLORS[tx.league] ?? 'bg-muted text-muted-foreground')}>
                            {tx.league}
                          </Badge>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <PageFooter />
    </div>
  );
}
