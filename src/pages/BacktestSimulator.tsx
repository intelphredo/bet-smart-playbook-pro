import { useState } from "react";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine 
} from "recharts";
import { 
  FlaskConical, 
  Play, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Calendar,
  AlertTriangle,
  Trophy,
  Flame,
  Snowflake,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useBacktestSimulator, 
  BacktestStrategy, 
  getStrategyDisplayName, 
  getStrategyDescription 
} from "@/hooks/useBacktestSimulator";
import { InfoExplainer } from "@/components/ui/InfoExplainer";

const STRATEGIES: { value: BacktestStrategy; label: string; icon: string }[] = [
  { value: 'all_agree', label: 'All 3 Agree', icon: '🤝' },
  { value: 'majority_agree', label: '2+ Agree', icon: '👥' },
  { value: 'highest_confidence', label: 'Highest Confidence', icon: '🎯' },
  { value: 'best_performer', label: 'Best Performer', icon: '🏆' },
  { value: 'ml_power_index', label: 'ML Power Index', icon: '🤖' },
  { value: 'value_pick_finder', label: 'Value Pick Finder', icon: '💎' },
  { value: 'statistical_edge', label: 'Statistical Edge', icon: '📊' },
];

const TIME_RANGES = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

const LEAGUES = [
  { value: 'all', label: 'All Leagues' },
  { value: 'NBA', label: 'NBA' },
  { value: 'NFL', label: 'NFL' },
  { value: 'NHL', label: 'NHL' },
  { value: 'MLB', label: 'MLB' },
];

export default function BacktestSimulator() {
  const [strategy, setStrategy] = useState<BacktestStrategy>('majority_agree');
  const [startingBankroll, setStartingBankroll] = useState(1000);
  const [stakeType, setStakeType] = useState<'flat' | 'percentage' | 'kelly'>('flat');
  const [stakeAmount, setStakeAmount] = useState(100);
  const [minConfidence, setMinConfidence] = useState(50);
  const [days, setDays] = useState(30);
  const [league, setLeague] = useState('all');
  const [isRunning, setIsRunning] = useState(false);

  const { data: result, isLoading, refetch } = useBacktestSimulator({
    strategy,
    startingBankroll,
    stakeType,
    stakeAmount,
    minConfidence,
    days,
    league: league === 'all' ? undefined : league,
  });

  const handleRunBacktest = () => {
    setIsRunning(true);
    refetch().finally(() => setIsRunning(false));
  };

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+$' : '-$';
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            Daily P/L: <span className={cn(
              payload[0].value >= 0 ? 'text-green-500' : 'text-red-500'
            )}>{formatCurrency(payload[0].value)}</span>
          </p>
          <p className="text-sm">
            Cumulative: <span className={cn(
              payload[1]?.value >= 0 ? 'text-green-500' : 'text-red-500'
            )}>{formatCurrency(payload[1]?.value || 0)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main id="main-content" className="container py-6 space-y-6">
        <AppBreadcrumb />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Backtest Simulator
          </h1>
          <p className="text-muted-foreground text-sm">
            See hypothetical P/L if you had followed different algorithm strategies
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>Set up your backtest parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Strategy Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Strategy
                  <InfoExplainer term="consensus_pick" size="sm" />
                </Label>
                <Select value={strategy} onValueChange={(v) => setStrategy(v as BacktestStrategy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2">
                          <span>{s.icon}</span>
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getStrategyDescription(strategy)}
                </p>
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Time Period
                </Label>
                <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* League Filter */}
              <div className="space-y-2">
                <Label>League</Label>
                <Select value={league} onValueChange={setLeague}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAGUES.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Starting Bankroll */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Starting Bankroll
                </Label>
                <Input
                  type="number"
                  value={startingBankroll}
                  onChange={(e) => setStartingBankroll(Number(e.target.value))}
                  min={100}
                  step={100}
                />
              </div>

              {/* Stake Type */}
              <div className="space-y-2">
                <Label>Stake Type</Label>
                <Select value={stakeType} onValueChange={(v) => setStakeType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat (Fixed Amount)</SelectItem>
                    <SelectItem value="percentage">Percentage of Bankroll</SelectItem>
                    <SelectItem value="kelly">Kelly Criterion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stake Amount */}
              <div className="space-y-2">
                <Label>
                  {stakeType === 'flat' ? 'Stake Amount ($)' : 
                   stakeType === 'percentage' ? 'Stake (% of Bankroll)' : 
                   'Kelly Multiplier (%)'}
                </Label>
                <Input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  min={1}
                  max={stakeType === 'flat' ? startingBankroll : 100}
                />
              </div>

              {/* Min Confidence */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Min Confidence
                  </Label>
                  <span className="text-sm font-medium">{minConfidence}%</span>
                </div>
                <Slider
                  value={[minConfidence]}
                  onValueChange={([v]) => setMinConfidence(v)}
                  min={0}
                  max={90}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Only bet when confidence is at least {minConfidence}%
                </p>
              </div>

              {/* Run Button */}
              <Button 
                className="w-full" 
                onClick={handleRunBacktest}
                disabled={isLoading || isRunning}
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Backtest'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
                <Skeleton className="h-[300px]" />
              </div>
            ) : !result ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Configure & Run</h3>
                  <p className="text-muted-foreground text-sm">
                    Set your parameters and click "Run Backtest" to see results
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className={cn(
                    "border-2",
                    result.totalProfit >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                  )}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        {result.totalProfit >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className={cn(
                            "text-2xl font-bold",
                            result.totalProfit >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {formatCurrency(result.totalProfit)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total P/L</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{result.winRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate ({result.wins}-{result.losses})</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className={cn(
                            "text-2xl font-bold",
                            result.roi >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">ROI</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-2xl font-bold">${result.finalBankroll.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Final Bankroll</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">{result.totalBets}</p>
                    <p className="text-xs text-muted-foreground">Total Bets</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-500">-${result.maxDrawdown.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Max Drawdown</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <p className="text-lg font-bold">{result.longestWinStreak}</p>
                    <p className="text-xs text-muted-foreground">Best Streak</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center flex items-center justify-center gap-1">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                    <p className="text-lg font-bold">{result.longestLoseStreak}</p>
                    <p className="text-xs text-muted-foreground">Cold Streak</p>
                  </div>
                </div>

                {/* Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cumulative P/L Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.profitByDay.length > 0 ? (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.profitByDay}>
                            <defs>
                              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(v) => `$${v}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                            <Area 
                              type="monotone" 
                              dataKey="cumulative" 
                              stroke="hsl(var(--chart-1))" 
                              fill="url(#profitGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No data to display</p>
                    )}
                  </CardContent>
                </Card>

                {/* Bet History Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bet History</CardTitle>
                    <CardDescription>All simulated bets for this strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Prediction</TableHead>
                            <TableHead>Conf</TableHead>
                            <TableHead>Stake</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>P/L</TableHead>
                            <TableHead>Bankroll</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.betHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                No bets matched the strategy criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            result.betHistory.slice(0, 50).map((bet, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">{bet.date}</TableCell>
                                <TableCell className="max-w-[150px] truncate text-xs" title={bet.matchTitle}>
                                  {bet.matchTitle}
                                </TableCell>
                                <TableCell className="text-xs">{bet.prediction.substring(0, 20)}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {bet.confidence}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">${bet.stake.toFixed(0)}</TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "text-xs",
                                    bet.result === 'won' 
                                      ? "bg-green-500/20 text-green-600" 
                                      : "bg-red-500/20 text-red-600"
                                  )}>
                                    {bet.result}
                                  </Badge>
                                </TableCell>
                                <TableCell className={cn(
                                  "text-xs font-medium",
                                  bet.profit >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                  {formatCurrency(bet.profit)}
                                </TableCell>
                                <TableCell className="text-xs">${bet.bankrollAfter.toFixed(0)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {result.betHistory.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Showing 50 of {result.betHistory.length} bets
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
