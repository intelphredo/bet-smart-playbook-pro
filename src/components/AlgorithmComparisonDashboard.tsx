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

// Win rate comparison chart
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
          <Tabs defaultValue="chart" className="space-y-4">
            <TabsList>
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
              <Card>
                <CardHeader>
                  <CardTitle>Consensus Analysis</CardTitle>
                  <CardDescription>
                    Performance when algorithms agree vs. disagree
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AgreementStats stats={data.agreementStats} />
                </CardContent>
              </Card>
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
