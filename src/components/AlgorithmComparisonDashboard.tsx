import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Zap,
  BarChart3,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  Sparkles,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Medal,
  CheckCheck,
  Clock,
  Star,
  Gauge,
} from "lucide-react";
import { useAlgorithmComparison } from "@/hooks/useAlgorithmComparison";
import { cn } from "@/lib/utils";

const ALGORITHM_CONFIG = {
  "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8": {
    name: "ML Power Index",
    shortName: "ML Power",
    icon: "🤖",
    color: "hsl(var(--chart-1))",
    bgColor: "bg-chart-1/10",
    textColor: "text-chart-1",
    borderColor: "border-chart-1/30",
  },
  "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2": {
    name: "Value Pick Finder",
    shortName: "Value Pick",
    icon: "💎",
    color: "hsl(var(--chart-2))",
    bgColor: "bg-chart-2/10",
    textColor: "text-chart-2",
    borderColor: "border-chart-2/30",
  },
  "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1": {
    name: "Statistical Edge",
    shortName: "Stat Edge",
    icon: "📊",
    color: "hsl(var(--chart-3))",
    bgColor: "bg-chart-3/10",
    textColor: "text-chart-3",
    borderColor: "border-chart-3/30",
    primary: true,
  },
};

const TIME_RANGES = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
];

const getAlgorithmConfig = (id: string) => {
  const config = ALGORITHM_CONFIG[id as keyof typeof ALGORITHM_CONFIG];
  if (config) {
    return { ...config, primary: 'primary' in config ? config.primary : false };
  }
  return {
    name: "Unknown",
    shortName: "Unknown",
    icon: "❓",
    color: "hsl(var(--muted-foreground))",
    bgColor: "bg-muted/10",
    textColor: "text-muted-foreground",
    borderColor: "border-muted/30",
    primary: false,
  };
};

// Streak display component
const StreakBadge = ({ streak }: { streak: number }) => {
  if (streak === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" /> 0
      </Badge>
    );
  }
  
  if (streak > 0) {
    return (
      <Badge className="gap-1 bg-green-500/20 text-green-600 border-green-500/30">
        <ArrowUpRight className="h-3 w-3" /> W{streak}
      </Badge>
    );
  }
  
  return (
    <Badge className="gap-1 bg-red-500/20 text-red-600 border-red-500/30">
      <ArrowDownRight className="h-3 w-3" /> L{Math.abs(streak)}
    </Badge>
  );
};

// Recent results display
const RecentResults = ({ results }: { results: ('W' | 'L')[] }) => {
  if (!results.length) {
    return <span className="text-muted-foreground text-xs">No data</span>;
  }
  
  return (
    <div className="flex gap-0.5">
      {results.slice(0, 10).map((result, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
            result === 'W' 
              ? "bg-green-500/20 text-green-600" 
              : "bg-red-500/20 text-red-600"
          )}
        >
          {result}
        </div>
      ))}
    </div>
  );
};

// Algorithm card component
const AlgorithmCard = ({ 
  algorithm, 
  rank,
  isLeader 
}: { 
  algorithm: {
    algorithmId: string;
    algorithmName: string;
    totalPredictions: number;
    wins: number;
    losses: number;
    winRate: number;
    avgConfidence: number;
    recentResults: ('W' | 'L')[];
    roi: number;
    streak: number;
  };
  rank: number;
  isLeader: boolean;
}) => {
  const config = getAlgorithmConfig(algorithm.algorithmId);
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      isLeader && "ring-2 ring-yellow-500/50"
    )}>
      {isLeader && (
        <div className="absolute top-2 right-2">
          <Crown className="h-5 w-5 text-yellow-500" />
        </div>
      )}
      {config.primary && (
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] h-5">
            <Sparkles className="h-3 w-3 mr-1" />
            Primary
          </Badge>
        </div>
      )}
      
      <CardHeader className={cn("pb-2", config.primary && "pt-8")}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
            config.bgColor
          )}>
            {config.icon}
          </div>
          <div>
            <CardTitle className="text-lg">{config.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>Rank #{rank}</span>
              <span>•</span>
              <span>{algorithm.totalPredictions} settled picks</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Win Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Win Rate</span>
            <span className={cn(
              "text-2xl font-bold",
              algorithm.winRate >= 55 ? "text-green-500" : 
              algorithm.winRate >= 50 ? "text-yellow-500" : "text-red-500"
            )}>
              {algorithm.winRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={algorithm.winRate} 
            className="h-2"
          />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Record</p>
            <p className="font-semibold">
              <span className="text-green-500">{algorithm.wins}W</span>
              {" - "}
              <span className="text-red-500">{algorithm.losses}L</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className={cn(
              "font-semibold",
              algorithm.roi >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {algorithm.roi >= 0 ? "+" : ""}{algorithm.roi.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
            <p className="font-semibold">{algorithm.avgConfidence.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <StreakBadge streak={algorithm.streak} />
          </div>
        </div>
        
        {/* Recent Results */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Last 10 Results</p>
          <RecentResults results={algorithm.recentResults} />
        </div>
      </CardContent>
    </Card>
  );
};

// Head to Head comparison table
const HeadToHeadTable = ({ headToHead }: { headToHead: any[] }) => {
  if (!headToHead.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No head-to-head data available yet</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Matchup</TableHead>
          <TableHead className="text-center">Disagreements</TableHead>
          <TableHead className="text-right">Winner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {headToHead.map((h2h, i) => {
          const alg1Config = getAlgorithmConfig(h2h.algorithm1Id);
          const alg2Config = getAlgorithmConfig(h2h.algorithm2Id);
          const winner = h2h.winRate1 > h2h.winRate2 ? 1 : h2h.winRate2 > h2h.winRate1 ? 2 : 0;
          
          return (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", winner === 1 && "text-green-500")}>
                    {alg1Config.icon} {alg1Config.shortName}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={cn("font-medium", winner === 2 && "text-green-500")}>
                    {alg2Config.icon} {alg2Config.shortName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{h2h.disagreements}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className={cn(winner === 1 && "font-bold text-green-500")}>
                    {h2h.algorithm1Wins} ({h2h.winRate1.toFixed(0)}%)
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={cn(winner === 2 && "font-bold text-green-500")}>
                    {h2h.algorithm2Wins} ({h2h.winRate2.toFixed(0)}%)
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

// Agreement stats component
const AgreementStats = ({ stats }: { stats: any }) => {
  const data = [
    { 
      name: "Full Agreement", 
      count: stats.fullAgreement, 
      winRate: stats.fullAgreementWinRate,
      color: "hsl(var(--chart-2))"
    },
    { 
      name: "Partial Agreement", 
      count: stats.partialAgreement, 
      winRate: stats.partialAgreementWinRate,
      color: "hsl(var(--chart-4))"
    },
    { 
      name: "No Agreement", 
      count: stats.noAgreement, 
      winRate: stats.noAgreementWinRate,
      color: "hsl(var(--chart-5))"
    },
  ];
  
  const total = stats.fullAgreement + stats.partialAgreement + stats.noAgreement;
  
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{item.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.count} picks</Badge>
              <span className={cn(
                "font-semibold",
                item.winRate >= 55 ? "text-green-500" : 
                item.winRate >= 50 ? "text-yellow-500" : "text-red-500"
              )}>
                {item.winRate.toFixed(1)}% WR
              </span>
            </div>
          </div>
          <Progress 
            value={total > 0 ? (item.count / total) * 100 : 0} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
};

// Consensus Picks component - shows when all algorithms agree
const ConsensusPicks = ({ 
  consensusPicks, 
  agreementStats 
}: { 
  consensusPicks: any[];
  agreementStats: any;
}) => {
  const fullAgreementPicks = consensusPicks.filter(p => p.agreementLevel === 'full');
  const settledFullAgreement = fullAgreementPicks.filter(p => p.result !== 'pending');
  const fullAgreementWins = settledFullAgreement.filter(p => p.result === 'won').length;
  const fullAgreementWinRate = settledFullAgreement.length > 0 
    ? (fullAgreementWins / settledFullAgreement.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Consensus Stats Banner */}
      <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/30">
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCheck className="h-6 w-6 text-green-500" />
                <span className="text-3xl font-bold text-green-500">
                  {fullAgreementWinRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Full Agreement Win Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-6 w-6 text-yellow-500" />
                <span className="text-3xl font-bold">
                  {agreementStats.fullAgreement}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Full Agreement Picks</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-6 w-6 text-blue-500" />
                <span className="text-3xl font-bold">
                  {agreementStats.partialAgreement}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Partial Agreement</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-6 w-6 text-red-500" />
                <span className="text-3xl font-bold">
                  {agreementStats.noAgreement}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Split Decisions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate Comparison by Agreement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Win Rate by Agreement Level
          </CardTitle>
          <CardDescription>
            Higher agreement typically correlates with better prediction accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-green-500" />
                Full (3/3)
              </div>
              <div className="flex-1">
                <Progress 
                  value={agreementStats.fullAgreementWinRate} 
                  className="h-6"
                />
              </div>
              <div className="w-24 text-right">
                <span className={cn(
                  "font-bold",
                  agreementStats.fullAgreementWinRate >= 55 ? "text-green-500" : 
                  agreementStats.fullAgreementWinRate >= 50 ? "text-yellow-500" : "text-red-500"
                )}>
                  {agreementStats.fullAgreementWinRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Partial (2/3)
              </div>
              <div className="flex-1">
                <Progress 
                  value={agreementStats.partialAgreementWinRate} 
                  className="h-6"
                />
              </div>
              <div className="w-24 text-right">
                <span className={cn(
                  "font-bold",
                  agreementStats.partialAgreementWinRate >= 55 ? "text-green-500" : 
                  agreementStats.partialAgreementWinRate >= 50 ? "text-yellow-500" : "text-red-500"
                )}>
                  {agreementStats.partialAgreementWinRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Split (1/1/1)
              </div>
              <div className="flex-1">
                <Progress 
                  value={agreementStats.noAgreementWinRate} 
                  className="h-6"
                />
              </div>
              <div className="w-24 text-right">
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
        </CardContent>
      </Card>

      {/* Full Agreement Picks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Full Consensus Picks
            <Badge variant="secondary" className="ml-2">
              {fullAgreementPicks.length} total
            </Badge>
          </CardTitle>
          <CardDescription>
            When all 3 algorithms agree on the same prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fullAgreementPicks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No full consensus picks yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {fullAgreementPicks.slice(0, 20).map((pick, index) => (
                <div 
                  key={pick.matchId + index}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    pick.result === 'won' ? "bg-green-500/5 border-green-500/30" :
                    pick.result === 'lost' ? "bg-red-500/5 border-red-500/30" :
                    "bg-muted/30 border-muted"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{LEAGUE_ICONS[pick.league] || "🎯"}</span>
                      <span className="font-medium">{pick.matchTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pick.result === 'won' && (
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Won
                        </Badge>
                      )}
                      {pick.result === 'lost' && (
                        <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
                          <XCircle className="h-3 w-3 mr-1" />
                          Lost
                        </Badge>
                      )}
                      {pick.result === 'pending' && (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Consensus:</span>
                        <Badge variant="secondary" className="font-semibold">
                          {pick.consensusPrediction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <span className={cn(
                          "font-semibold text-sm",
                          pick.consensusConfidence >= 70 ? "text-green-500" :
                          pick.consensusConfidence >= 60 ? "text-yellow-500" : "text-muted-foreground"
                        )}>
                          {pick.consensusConfidence.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{pick.date}</span>
                  </div>
                  {/* Algorithm breakdown */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-muted/50">
                    {pick.algorithms.map((alg: any) => {
                      const config = getAlgorithmConfig(alg.algorithmId);
                      return (
                        <Tooltip key={alg.algorithmId}>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs",
                              config.bgColor
                            )}>
                              <span>{config.icon}</span>
                              <span>{alg.confidence.toFixed(0)}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{config.name}: {alg.prediction} @ {alg.confidence.toFixed(1)}%</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
              {fullAgreementPicks.length > 20 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Showing 20 of {fullAgreementPicks.length} consensus picks
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Confidence range icons
const CONFIDENCE_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  "50-59%": { icon: "🔵", color: "text-blue-500", label: "Low Confidence" },
  "60-69%": { icon: "🟡", color: "text-yellow-500", label: "Medium Confidence" },
  "70-79%": { icon: "🟠", color: "text-orange-500", label: "High Confidence" },
  "80%+": { icon: "🔴", color: "text-red-500", label: "Very High Confidence" },
};

// Confidence Breakdown component
const ConfidenceBreakdown = ({ performanceByConfidence }: { performanceByConfidence: any[] }) => {
  if (!performanceByConfidence || performanceByConfidence.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Gauge className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No confidence breakdown data available yet</p>
      </Card>
    );
  }

  // Get all algorithm IDs
  const allAlgorithmIds = new Set<string>();
  performanceByConfidence.forEach(conf => {
    conf.algorithms.forEach((alg: any) => {
      allAlgorithmIds.add(alg.algorithmId);
    });
  });
  const algorithmIds = Array.from(allAlgorithmIds);

  // Prepare chart data
  const chartData = performanceByConfidence.map(conf => {
    const entry: any = {
      range: conf.range,
      ...CONFIDENCE_ICONS[conf.range],
    };
    conf.algorithms.forEach((alg: any) => {
      const config = getAlgorithmConfig(alg.algorithmId);
      entry[config.shortName] = alg.winRate;
      entry[`${config.shortName}_total`] = alg.total;
    });
    return entry;
  });

  // Find best algorithm per confidence range
  const bestByConfidence = performanceByConfidence.map(conf => {
    const best = conf.algorithms.reduce((prev: any, current: any) => 
      (prev.winRate > current.winRate) ? prev : current
    , conf.algorithms[0]);
    return {
      range: conf.range,
      best: best ? getAlgorithmConfig(best.algorithmId) : null,
      winRate: best?.winRate || 0,
      total: best?.total || 0,
    };
  });

  // Calculate overall insights
  const highConfidencePerformance = performanceByConfidence.find(c => c.range === "80%+" || c.range === "70-79%");
  const lowConfidencePerformance = performanceByConfidence.find(c => c.range === "50-59%");

  return (
    <div className="space-y-6">
      {/* Key Insight Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Gauge className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Confidence Calibration Insight</h3>
              <p className="text-sm text-muted-foreground">
                {highConfidencePerformance && lowConfidencePerformance ? (
                  <>
                    High confidence picks (70%+) have a{" "}
                    <span className="font-semibold text-green-500">
                      {((highConfidencePerformance.algorithms[0]?.winRate || 0) - 
                        (lowConfidencePerformance.algorithms[0]?.winRate || 0)).toFixed(1)}%
                    </span>{" "}
                    better win rate than low confidence picks on average
                  </>
                ) : (
                  "Track more predictions to see calibration insights"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Algorithm by Confidence Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Best Algorithm by Confidence Level
          </CardTitle>
          <CardDescription>
            Which model performs best at each confidence tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestByConfidence.map(({ range, best, winRate, total }) => {
              const confInfo = CONFIDENCE_ICONS[range] || { icon: "🎯", color: "text-muted-foreground", label: range };
              return (
                <div 
                  key={range}
                  className={cn(
                    "p-4 rounded-lg border",
                    best?.bgColor || "bg-muted/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{confInfo.icon}</span>
                    <div>
                      <span className="font-semibold block">{range}</span>
                      <span className="text-xs text-muted-foreground">{confInfo.label}</span>
                    </div>
                  </div>
                  {best && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {best.icon} {best.shortName}
                        </span>
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={cn(
                          winRate >= 55 ? "bg-green-500/20 text-green-600" :
                          winRate >= 50 ? "bg-yellow-500/20 text-yellow-600" :
                          "bg-red-500/20 text-red-600"
                        )}>
                          {winRate.toFixed(1)}% WR
                        </Badge>
                        <span className="text-xs text-muted-foreground">{total} picks</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chart Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by Confidence Range</CardTitle>
          <CardDescription>
            Compare how each algorithm performs at different confidence levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="range" 
                tickFormatter={(value) => `${CONFIDENCE_ICONS[value]?.icon || ""} ${value}`}
              />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string, props: any) => {
                  const totalKey = `${name}_total`;
                  const total = props.payload[totalKey];
                  return [`${value.toFixed(1)}% (${total || 0} picks)`, name];
                }}
              />
              <Legend />
              {algorithmIds.map((algId) => {
                const config = getAlgorithmConfig(algId);
                return (
                  <Bar 
                    key={algId}
                    dataKey={config.shortName} 
                    name={config.shortName}
                    fill={config.color}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Confidence Statistics</CardTitle>
          <CardDescription>
            Complete breakdown of each algorithm's performance per confidence tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Confidence Range</TableHead>
                {algorithmIds.map((algId) => {
                  const config = getAlgorithmConfig(algId);
                  return (
                    <TableHead key={algId} className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        {config.icon} {config.shortName}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceByConfidence.map((conf) => {
                const confInfo = CONFIDENCE_ICONS[conf.range] || { icon: "🎯", color: "text-muted-foreground" };
                // Find best algorithm for this range
                const bestAlgId = conf.algorithms.reduce((prev: any, curr: any) => 
                  (prev.winRate > curr.winRate) ? prev : curr
                , conf.algorithms[0])?.algorithmId;

                return (
                  <TableRow key={conf.range}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{confInfo.icon}</span>
                        <div>
                          <span className="block">{conf.range}</span>
                          <span className="text-xs text-muted-foreground">
                            {'label' in confInfo ? confInfo.label : conf.range}
                          </span>
                        </div>
                      </span>
                    </TableCell>
                    {algorithmIds.map((algId) => {
                      const algData = conf.algorithms.find((a: any) => a.algorithmId === algId);
                      const isBest = algId === bestAlgId;
                      
                      if (!algData || algData.total === 0) {
                        return (
                          <TableCell key={algId} className="text-center text-muted-foreground">
                            -
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={algId} className="text-center">
                          <div className={cn(
                            "inline-flex flex-col items-center p-2 rounded-lg",
                            isBest && "bg-green-500/10 ring-1 ring-green-500/30"
                          )}>
                            <span className={cn(
                              "font-bold",
                              algData.winRate >= 55 ? "text-green-500" :
                              algData.winRate >= 50 ? "text-yellow-500" :
                              "text-red-500"
                            )}>
                              {algData.winRate.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {algData.total} picks
                            </span>
                            {isBest && (
                              <Crown className="h-3 w-3 text-yellow-500 mt-1" />
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Calibration Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Calibration Analysis
          </CardTitle>
          <CardDescription>
            Is higher confidence actually translating to better results?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {algorithmIds.map((algId) => {
              const config = getAlgorithmConfig(algId);
              const algPerformance = performanceByConfidence.map(conf => {
                const data = conf.algorithms.find((a: any) => a.algorithmId === algId);
                return {
                  range: conf.range,
                  winRate: data?.winRate || 0,
                  total: data?.total || 0,
                };
              }).filter(p => p.total > 0);

              // Check if calibrated (higher confidence = higher win rate)
              let isCalibrated = true;
              for (let i = 1; i < algPerformance.length; i++) {
                if (algPerformance[i].winRate < algPerformance[i-1].winRate - 5) {
                  isCalibrated = false;
                  break;
                }
              }

              return (
                <div key={algId} className={cn(
                  "p-4 rounded-lg border",
                  config.bgColor
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <span className="font-semibold">{config.name}</span>
                    </div>
                    <Badge variant={isCalibrated ? "default" : "secondary"} className={cn(
                      isCalibrated ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"
                    )}>
                      {isCalibrated ? "✓ Well Calibrated" : "⚠ Needs Calibration"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {algPerformance.map((p, i) => (
                      <div key={p.range} className="flex items-center">
                        <div className="text-center">
                          <div className={cn(
                            "text-sm font-semibold",
                            p.winRate >= 55 ? "text-green-500" :
                            p.winRate >= 50 ? "text-yellow-500" : "text-red-500"
                          )}>
                            {p.winRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">{p.range}</div>
                        </div>
                        {i < algPerformance.length - 1 && (
                          <div className="mx-2 text-muted-foreground">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
const WinRateChart = ({ algorithms }: { algorithms: any[] }) => {
  const data = algorithms.map(alg => {
    const config = getAlgorithmConfig(alg.algorithmId);
    return {
      name: config.shortName,
      winRate: alg.winRate,
      confidence: alg.avgConfidence,
      roi: alg.roi,
      color: config.color,
    };
  });
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" domain={[0, 100]} />
        <YAxis dataKey="name" type="category" width={100} />
        <RechartsTooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => [
            `${value.toFixed(1)}%`,
            name === 'winRate' ? 'Win Rate' : name === 'confidence' ? 'Confidence' : 'ROI'
          ]}
        />
        <Legend />
        <Bar dataKey="winRate" name="Win Rate" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// League icons mapping
const LEAGUE_ICONS: Record<string, string> = {
  NBA: "🏀",
  NFL: "🏈",
  MLB: "⚾",
  NHL: "🏒",
  NCAAB: "🏀",
  NCAAF: "🏈",
  SOCCER: "⚽",
  MLS: "⚽",
  EPL: "⚽",
  Unknown: "🎯",
};

// League breakdown component
const LeagueBreakdown = ({ performanceByLeague }: { performanceByLeague: any[] }) => {
  if (!performanceByLeague || performanceByLeague.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Medal className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No league performance data available yet</p>
      </Card>
    );
  }

  // Get all algorithm IDs across leagues
  const allAlgorithmIds = new Set<string>();
  performanceByLeague.forEach(league => {
    league.algorithms.forEach((alg: any) => {
      allAlgorithmIds.add(alg.algorithmId);
    });
  });
  const algorithmIds = Array.from(allAlgorithmIds);

  // Prepare chart data
  const chartData = performanceByLeague.map(league => {
    const entry: any = {
      league: league.league,
      icon: LEAGUE_ICONS[league.league] || "🎯",
    };
    league.algorithms.forEach((alg: any) => {
      const config = getAlgorithmConfig(alg.algorithmId);
      entry[config.shortName] = alg.winRate;
      entry[`${config.shortName}_total`] = alg.total;
    });
    return entry;
  });

  // Find best algorithm per league
  const bestByLeague = performanceByLeague.map(league => {
    const best = league.algorithms.reduce((prev: any, current: any) => 
      (prev.winRate > current.winRate) ? prev : current
    , league.algorithms[0]);
    return {
      league: league.league,
      best: best ? getAlgorithmConfig(best.algorithmId) : null,
      winRate: best?.winRate || 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Best Algorithm by League Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Best Algorithm by Sport
          </CardTitle>
          <CardDescription>
            Which model performs best in each league
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestByLeague.map(({ league, best, winRate }) => (
              <div 
                key={league}
                className={cn(
                  "p-4 rounded-lg border",
                  best?.bgColor || "bg-muted/10"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{LEAGUE_ICONS[league] || "🎯"}</span>
                  <span className="font-semibold">{league}</span>
                </div>
                {best && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {best.icon} {best.shortName}
                    </span>
                    <Badge variant="secondary" className={cn(
                      winRate >= 55 ? "bg-green-500/20 text-green-600" :
                      winRate >= 50 ? "bg-yellow-500/20 text-yellow-600" :
                      "bg-red-500/20 text-red-600"
                    )}>
                      {winRate.toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by League</CardTitle>
          <CardDescription>
            Compare algorithm performance across different sports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis 
                dataKey="league" 
                type="category" 
                width={80}
                tickFormatter={(value) => `${LEAGUE_ICONS[value] || ""} ${value}`}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string, props: any) => {
                  const totalKey = `${name}_total`;
                  const total = props.payload[totalKey];
                  return [`${value.toFixed(1)}% (${total || 0} picks)`, name];
                }}
              />
              <Legend />
              {algorithmIds.map((algId) => {
                const config = getAlgorithmConfig(algId);
                return (
                  <Bar 
                    key={algId}
                    dataKey={config.shortName} 
                    name={config.shortName}
                    fill={config.color}
                    radius={[0, 4, 4, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed League Statistics</CardTitle>
          <CardDescription>
            Complete breakdown of each algorithm's performance per league
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>League</TableHead>
                {algorithmIds.map((algId) => {
                  const config = getAlgorithmConfig(algId);
                  return (
                    <TableHead key={algId} className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        {config.icon} {config.shortName}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceByLeague.map((league) => {
                // Find best algorithm for this league
                const bestAlgId = league.algorithms.reduce((prev: any, curr: any) => 
                  (prev.winRate > curr.winRate) ? prev : curr
                , league.algorithms[0])?.algorithmId;

                return (
                  <TableRow key={league.league}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{LEAGUE_ICONS[league.league] || "🎯"}</span>
                        {league.league}
                      </span>
                    </TableCell>
                    {algorithmIds.map((algId) => {
                      const algData = league.algorithms.find((a: any) => a.algorithmId === algId);
                      const isBest = algId === bestAlgId;
                      
                      if (!algData) {
                        return (
                          <TableCell key={algId} className="text-center text-muted-foreground">
                            -
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={algId} className="text-center">
                          <div className={cn(
                            "inline-flex flex-col items-center p-2 rounded-lg",
                            isBest && "bg-green-500/10 ring-1 ring-green-500/30"
                          )}>
                            <span className={cn(
                              "font-bold",
                              algData.winRate >= 55 ? "text-green-500" :
                              algData.winRate >= 50 ? "text-yellow-500" :
                              "text-red-500"
                            )}>
                              {algData.winRate.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {algData.total} picks
                            </span>
                            {isBest && (
                              <Crown className="h-3 w-3 text-yellow-500 mt-1" />
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Main dashboard component
export default function AlgorithmComparisonDashboard() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error, refetch, isFetching } = useAlgorithmComparison({ days });
  
  const sortedAlgorithms = useMemo(() => {
    if (!data?.algorithms) return [];
    return [...data.algorithms].sort((a, b) => b.winRate - a.winRate);
  }, [data?.algorithms]);
  
  const bestAlgorithm = sortedAlgorithms[0];
  
  if (error) {
    return (
      <Card className="p-8 text-center">
        <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-destructive">Failed to load comparison data</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Algorithm Comparison
          </h2>
          <p className="text-muted-foreground">
            Side-by-side performance analysis of all 3 prediction algorithms
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value.toString()}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      ) : data && sortedAlgorithms.length > 0 ? (
        <>
          {/* Best Performer Banner */}
          {bestAlgorithm && (
            <Card className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best Performer</p>
                      <p className="font-bold text-lg">
                        {getAlgorithmConfig(bestAlgorithm.algorithmId).icon}{" "}
                        {bestAlgorithm.algorithmName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-500">
                      {bestAlgorithm.winRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Algorithm Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {sortedAlgorithms.map((algorithm, index) => (
              <AlgorithmCard
                key={algorithm.algorithmId}
                algorithm={algorithm}
                rank={index + 1}
                isLeader={index === 0}
              />
            ))}
          </div>
          
          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="league" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="league" className="gap-2">
                <Medal className="h-4 w-4" />
                By League
              </TabsTrigger>
              <TabsTrigger value="confidence" className="gap-2">
                <Gauge className="h-4 w-4" />
                By Confidence
              </TabsTrigger>
              <TabsTrigger value="chart" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="h2h" className="gap-2">
                <Users className="h-4 w-4" />
                Head-to-Head
              </TabsTrigger>
              <TabsTrigger value="agreement" className="gap-2">
                <Target className="h-4 w-4" />
                Consensus
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="league">
              <LeagueBreakdown performanceByLeague={data.performanceByContext.byLeague} />
            </TabsContent>
            
            <TabsContent value="confidence">
              <ConfidenceBreakdown performanceByConfidence={data.performanceByContext.byConfidence} />
            </TabsContent>
            
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle>Win Rate Comparison</CardTitle>
                  <CardDescription>
                    Visual comparison of win rates across all algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WinRateChart algorithms={sortedAlgorithms} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="h2h">
              <Card>
                <CardHeader>
                  <CardTitle>Head-to-Head Results</CardTitle>
                  <CardDescription>
                    When algorithms disagree, which one wins more often?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HeadToHeadTable headToHead={data.headToHead} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="agreement">
              <ConsensusPicks 
                consensusPicks={data.consensusPicks} 
                agreementStats={data.agreementStats}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card className="p-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Comparison Data</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            There isn't enough settled prediction data yet to compare algorithms.
            Check back after more predictions have been graded.
          </p>
        </Card>
      )}
    </div>
  );
}
