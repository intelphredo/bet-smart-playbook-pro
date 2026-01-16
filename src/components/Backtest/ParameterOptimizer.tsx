import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Zap, 
  Trophy, 
  Target, 
  TrendingUp,
  Activity,
  Settings2,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBacktestOptimizer, OptimizationConfig, OptimizationResult } from "@/hooks/useBacktestOptimizer";
import type { BacktestStrategy } from "@/hooks/useBacktestSimulator";
import { BacktestDateRangePicker } from "./BacktestDateRangePicker";
import { subDays } from "date-fns";

const STRATEGIES: { value: BacktestStrategy; label: string; icon: string }[] = [
  { value: 'all_agree', label: 'All 3 Agree', icon: '🤝' },
  { value: 'majority_agree', label: '2+ Agree', icon: '👥' },
  { value: 'highest_confidence', label: 'Highest Confidence', icon: '🎯' },
  { value: 'best_performer', label: 'Best Performer', icon: '🏆' },
  { value: 'ml_power_index', label: 'ML Power Index', icon: '🤖' },
  { value: 'value_pick_finder', label: 'Value Pick Finder', icon: '💎' },
  { value: 'statistical_edge', label: 'Statistical Edge', icon: '📊' },
];

const STAKE_TYPES = [
  { value: 'flat' as const, label: 'Flat Betting' },
  { value: 'percentage' as const, label: 'Percentage' },
  { value: 'kelly' as const, label: 'Kelly Criterion' },
];

interface ParameterOptimizerProps {
  startingBankroll: number;
  league?: string;
}

export function ParameterOptimizer({ startingBankroll, league }: ParameterOptimizerProps) {
  const { isRunning, progress, currentStep, results, bestResult, runOptimization, reset } = useBacktestOptimizer();
  
  // Config state
  const [selectedStrategies, setSelectedStrategies] = useState<BacktestStrategy[]>(['majority_agree', 'highest_confidence']);
  const [selectedStakeTypes, setSelectedStakeTypes] = useState<('flat' | 'percentage' | 'kelly')[]>(['flat', 'kelly']);
  const [confidenceRange, setConfidenceRange] = useState({ min: 40, max: 80, step: 10 });
  const [kellyFractions, setKellyFractions] = useState([25, 50, 75, 100]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 60),
    end: new Date(),
  });

  const toggleStrategy = (strat: BacktestStrategy) => {
    setSelectedStrategies(prev =>
      prev.includes(strat)
        ? prev.filter(s => s !== strat)
        : [...prev, strat]
    );
  };

  const toggleStakeType = (type: 'flat' | 'percentage' | 'kelly') => {
    setSelectedStakeTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleRunOptimization = () => {
    const config: OptimizationConfig = {
      strategies: selectedStrategies,
      startingBankroll,
      startDate: dateRange.start,
      endDate: dateRange.end,
      league,
      confidenceRange,
      stakeTypes: selectedStakeTypes,
      kellyFractions,
    };
    runOptimization(config);
  };

  const totalCombinations = 
    selectedStrategies.length * 
    ((confidenceRange.max - confidenceRange.min) / confidenceRange.step + 1) * 
    (selectedStakeTypes.filter(t => t !== 'kelly').length + 
     (selectedStakeTypes.includes('kelly') ? kellyFractions.length : 0));

  const formatCurrency = (value: number) => {
    return value >= 0 ? `+$${value.toFixed(0)}` : `-$${Math.abs(value).toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Optimization Settings
          </CardTitle>
          <CardDescription>
            Configure parameter ranges to search for optimal settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <BacktestDateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Strategies */}
          <div className="space-y-3">
            <Label>Strategies to Test</Label>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGIES.map(s => (
                <div key={s.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`opt-${s.value}`}
                    checked={selectedStrategies.includes(s.value)}
                    onCheckedChange={() => toggleStrategy(s.value)}
                  />
                  <label
                    htmlFor={`opt-${s.value}`}
                    className="text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Stake Types */}
          <div className="space-y-3">
            <Label>Stake Types</Label>
            <div className="flex flex-wrap gap-3">
              {STAKE_TYPES.map(t => (
                <div key={t.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stake-${t.value}`}
                    checked={selectedStakeTypes.includes(t.value)}
                    onCheckedChange={() => toggleStakeType(t.value)}
                  />
                  <label
                    htmlFor={`stake-${t.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {t.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Confidence Range</Label>
              <span className="text-sm text-muted-foreground">
                {confidenceRange.min}% - {confidenceRange.max}% (step: {confidenceRange.step}%)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  value={confidenceRange.min}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  min={0}
                  max={90}
                  step={5}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={confidenceRange.max}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Step</Label>
                <Input
                  type="number"
                  value={confidenceRange.step}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, step: Number(e.target.value) }))}
                  min={5}
                  max={20}
                  step={5}
                />
              </div>
            </div>
          </div>

          {/* Kelly Fractions */}
          {selectedStakeTypes.includes('kelly') && (
            <div className="space-y-3">
              <Label>Kelly Fractions to Test (%)</Label>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100].map(frac => (
                  <Badge
                    key={frac}
                    variant={kellyFractions.includes(frac) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setKellyFractions(prev =>
                        prev.includes(frac)
                          ? prev.filter(f => f !== frac)
                          : [...prev, frac].sort((a, b) => a - b)
                      );
                    }}
                  >
                    {frac}%
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Summary and Run Button */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total combinations to test:</span>
              <Badge variant="secondary">{totalCombinations}</Badge>
            </div>
            
            <Button
              className="w-full"
              onClick={handleRunOptimization}
              disabled={isRunning || selectedStrategies.length === 0 || selectedStakeTypes.length === 0}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isRunning ? 'Optimizing...' : 'Run Optimization'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{currentStep}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isRunning && results.length > 0 && (
        <>
          {/* Best Result */}
          {bestResult && (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Recommended Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Strategy</p>
                    <p className="font-medium">{bestResult.strategyName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Min Confidence</p>
                    <p className="font-medium">{bestResult.minConfidence}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Stake Type</p>
                    <p className="font-medium capitalize">{bestResult.stakeType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className={cn("font-bold text-lg", bestResult.roi >= 0 ? "text-green-500" : "text-red-500")}>
                      {bestResult.roi >= 0 ? '+' : ''}{bestResult.roi.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className={cn("text-lg font-bold", bestResult.totalProfit >= 0 ? "text-green-500" : "text-red-500")}>
                      {formatCurrency(bestResult.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Profit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{bestResult.winRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{bestResult.totalBets}</p>
                    <p className="text-xs text-muted-foreground">Total Bets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{bestResult.sharpeRatio.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <p>
                      Based on historical data, this configuration provides the best risk-adjusted returns.
                      Consider running Monte Carlo simulation to validate before live betting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Results
                <Badge variant="secondary" className="ml-2">{results.length} configurations</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Stake</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Win Rate</TableHead>
                      <TableHead>Bets</TableHead>
                      <TableHead>Sharpe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(0, 50).map((r, idx) => (
                      <TableRow key={idx} className={idx === 0 ? "bg-primary/5" : ""}>
                        <TableCell>
                          {idx === 0 ? <Trophy className="h-4 w-4 text-yellow-500" /> : idx + 1}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{r.strategyName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.minConfidence}%</Badge>
                        </TableCell>
                        <TableCell className="capitalize text-sm">{r.stakeType}</TableCell>
                        <TableCell className={cn("font-medium", r.totalProfit >= 0 ? "text-green-500" : "text-red-500")}>
                          {formatCurrency(r.totalProfit)}
                        </TableCell>
                        <TableCell className={cn("font-medium", r.roi >= 0 ? "text-green-500" : "text-red-500")}>
                          {r.roi >= 0 ? '+' : ''}{r.roi.toFixed(1)}%
                        </TableCell>
                        <TableCell>{r.winRate.toFixed(1)}%</TableCell>
                        <TableCell>{r.totalBets}</TableCell>
                        <TableCell>{r.sharpeRatio.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {results.length > 50 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Showing top 50 of {results.length} results
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
