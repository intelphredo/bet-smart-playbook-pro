import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Dices,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useBacktestSimulator, 
  BacktestStrategy, 
  getStrategyDisplayName, 
  getStrategyDescription 
} from "@/hooks/useBacktestSimulator";
import { useMonteCarloSimulation } from "@/hooks/useMonteCarloSimulation";
import { useStrategyComparison } from "@/hooks/useStrategyComparison";
import { MonteCarloCharts } from "@/components/MonteCarloCharts";
import { StrategyComparisonView } from "@/components/StrategyComparisonView";
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

const ALL_STRATEGIES: BacktestStrategy[] = [
  'all_agree', 'majority_agree', 'highest_confidence', 'best_performer',
  'ml_power_index', 'value_pick_finder', 'statistical_edge'
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
  const [activeTab, setActiveTab] = useState('results');
  const [numSimulations, setNumSimulations] = useState(1000);
  const [mainView, setMainView] = useState<'single' | 'compare'>('single');
  const [selectedStrategies, setSelectedStrategies] = useState<BacktestStrategy[]>(ALL_STRATEGIES);
  const [runComparison, setRunComparison] = useState(false);

  const { data: result, isLoading, refetch } = useBacktestSimulator({
    strategy,
    startingBankroll,
    stakeType,
    stakeAmount,
    minConfidence,
    days,
    league: league === 'all' ? undefined : league,
  });

  // Strategy Comparison
  const { 
    data: comparisonData, 
    isLoading: comparisonLoading,
    refetch: refetchComparison 
  } = useStrategyComparison({
    strategies: selectedStrategies,
    startingBankroll,
    stakeType,
    stakeAmount,
    minConfidence,
    days,
    league: league === 'all' ? undefined : league,
  }, runComparison && mainView === 'compare');

  // Monte Carlo simulation
  const monteCarloResult = useMonteCarloSimulation(
    result?.betHistory || [],
    {
      numSimulations,
      startingBankroll,
      stakeType,
      stakeAmount,
    },
    !!result && result.betHistory.length >= 5
  );

  const handleRunBacktest = async () => {
    setIsRunning(true);
    try {
      await refetch();
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunComparison = () => {
    setRunComparison(true);
    setIsRunning(true);
    // Allow state to update, then the query will run automatically
    setTimeout(() => setIsRunning(false), 500);
  };

  const toggleStrategy = (strat: BacktestStrategy) => {
    setSelectedStrategies(prev => 
      prev.includes(strat) 
        ? prev.filter(s => s !== strat)
        : [...prev, strat]
    );
    setRunComparison(false); // Reset to require new run
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

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mainView === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMainView('single')}
          >
            <FlaskConical className="h-4 w-4 mr-1" />
            Single Strategy
          </Button>
          <Button
            variant={mainView === 'compare' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMainView('compare')}
          >
            <GitCompare className="h-4 w-4 mr-1" />
            Compare All
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                {mainView === 'single' 
                  ? 'Set up your backtest parameters' 
                  : 'Compare all strategies side-by-side'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Strategy Selection - Only show for single mode */}
              {mainView === 'single' && (
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
              )}

              {/* Strategy Selection for Compare Mode */}
              {mainView === 'compare' && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-1">
                    <GitCompare className="h-4 w-4" />
                    Strategies to Compare
                  </Label>
                  <div className="space-y-2">
                    {STRATEGIES.map(s => (
                      <div key={s.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={s.value}
                          checked={selectedStrategies.includes(s.value)}
                          onCheckedChange={() => toggleStrategy(s.value)}
                        />
                        <label
                          htmlFor={s.value}
                          className="text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <span>{s.icon}</span>
                          {s.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select strategies to compare ({selectedStrategies.length} selected)
                  </p>
                </div>
              )}

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

              {/* Monte Carlo Simulations - Only for single mode */}
              {mainView === 'single' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Dices className="h-4 w-4" />
                    Monte Carlo Simulations
                  </Label>
                  <Select value={String(numSimulations)} onValueChange={(v) => setNumSimulations(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 simulations</SelectItem>
                      <SelectItem value="500">500 simulations</SelectItem>
                      <SelectItem value="1000">1,000 simulations</SelectItem>
                      <SelectItem value="5000">5,000 simulations</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    More simulations = more accurate probability estimates
                  </p>
                </div>
              )}

              {/* Run Button */}
              {mainView === 'single' ? (
                <Button 
                  className="w-full" 
                  onClick={handleRunBacktest}
                  disabled={isLoading || isRunning}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Backtest'}
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleRunComparison}
                  disabled={comparisonLoading || isRunning || selectedStrategies.length < 2}
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  {comparisonLoading || isRunning ? 'Comparing...' : `Compare ${selectedStrategies.length} Strategies`}
                </Button>
              )}

              {mainView === 'compare' && selectedStrategies.length < 2 && (
                <p className="text-xs text-destructive text-center">
                  Select at least 2 strategies to compare
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {mainView === 'compare' ? (
              /* Strategy Comparison View */
              <StrategyComparisonView 
                data={comparisonData} 
                isLoading={comparisonLoading} 
                startingBankroll={startingBankroll}
              />
            ) : isLoading ? (
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="results" className="gap-1">
                    <Activity className="h-4 w-4" />
                    Results
                  </TabsTrigger>
                  <TabsTrigger value="montecarlo" className="gap-1">
                    <Dices className="h-4 w-4" />
                    Monte Carlo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-6">
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
                </TabsContent>

                <TabsContent value="montecarlo" className="space-y-6">
                  {!monteCarloResult ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Dices className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Insufficient Data</h3>
                        <p className="text-muted-foreground text-sm">
                          Need at least 5 historical bets to run Monte Carlo simulation.
                          <br />
                          Current bets: {result.betHistory.length}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card className="bg-muted/20 border-dashed">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium">What is Monte Carlo Simulation?</p>
                              <p className="text-muted-foreground">
                                We run {numSimulations.toLocaleString()} simulations by randomly reordering your bets to show the range of possible outcomes. 
                                This helps you understand the uncertainty and risk in your strategy beyond just the historical result.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <MonteCarloCharts result={monteCarloResult} startingBankroll={startingBankroll} />
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
