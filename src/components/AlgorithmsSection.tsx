import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Calendar, ChartLine, TrendingUp, Cpu, Sparkles, ArrowRight, Brain, Target, Zap, RefreshCw } from "lucide-react";
import { useAlgorithmPerformance } from "@/hooks/useAlgorithmPerformance";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DateRangeFilter from "./DateRangeFilter";
import { cn } from "@/lib/utils";
import { BettingAlgorithm } from "@/types/sports";

interface AlgorithmCardProps {
  algorithm: BettingAlgorithm;
  index: number;
}

const algorithmIcons = [Brain, Target, Zap];
const algorithmColors = [
  "from-blue-500/20 via-indigo-500/10 to-purple-500/5",
  "from-emerald-500/20 via-teal-500/10 to-cyan-500/5",
  "from-orange-500/20 via-amber-500/10 to-yellow-500/5",
];

function AlgorithmCard({ algorithm, index }: AlgorithmCardProps) {
  const Icon = algorithmIcons[index % algorithmIcons.length];
  const gradientClass = algorithmColors[index % algorithmColors.length];
  const winRate = algorithm.winRate || 0;
  const isHighPerformer = winRate >= 55;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardHeader className={cn("p-4 bg-gradient-to-br", gradientClass)}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{algorithm.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {algorithm.totalPicks || 0} predictions
              </p>
            </div>
          </div>
          <Badge
            variant={isHighPerformer ? "default" : "secondary"}
            className={cn(
              "font-bold",
              isHighPerformer && "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {winRate.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {algorithm.description}
        </p>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Win Rate</span>
            <span className={cn(
              "font-semibold",
              winRate >= 55 ? "text-emerald-500" : winRate >= 50 ? "text-primary" : "text-muted-foreground"
            )}>
              {winRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={winRate} 
            className="h-2"
          />
        </div>
        
        {algorithm.recentResults && algorithm.recentResults.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Recent Results</div>
            <div className="flex gap-1">
              {algorithm.recentResults.slice(0, 10).map((result, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105",
                    result === "W"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                  )}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlgorithmsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array(3).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="flex gap-1">
              {Array(8).fill(0).map((_, j) => (
                <Skeleton key={j} className="w-6 h-6 rounded-md" />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyAlgorithms({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <Cpu className="w-12 h-12 text-primary/60" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Algorithms Warming Up</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-2">
          Our prediction algorithms are processing data and generating picks. 
          Check back soon to see performance metrics and winning predictions.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Algorithms analyze thousands of data points including injuries, weather, and historical performance
        </p>
        
        <div className="flex items-center gap-3">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
          <Link to="/algorithms">
            <Button className="gap-2">
              Explore Algorithms
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="col-span-full border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ChartLine className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Unable to Load Algorithms</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We're having trouble fetching algorithm data. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

const AlgorithmsSection = () => {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { data: algorithms, isLoading, error, refetch } = useAlgorithmPerformance({
    dateRange,
  });

  useEffect(() => {
    const channel = supabase
      .channel('algorithm-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'algorithm_predictions'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const resetDateFilter = () => {
    setDateRange({});
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Winning Algorithms</h2>
            <p className="text-sm text-muted-foreground">AI-powered prediction systems</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={resetDateFilter}
          />
          <Link to="/standings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>View Standings</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {error ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ErrorState onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <AlgorithmsSkeleton />
      ) : !algorithms || algorithms.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmptyAlgorithms onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {algorithms.map((algorithm, index) => (
            <AlgorithmCard key={algorithm.name} algorithm={algorithm} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlgorithmsSection;
