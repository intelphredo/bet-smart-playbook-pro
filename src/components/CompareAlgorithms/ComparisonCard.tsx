import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AlgorithmSummary } from "@/hooks/useAlgorithmComparison";

interface ComparisonCardProps {
  algorithm: AlgorithmSummary;
  rank: number;
  isLeader?: boolean;
}

const algorithmColors: Record<string, string> = {
  'ML Power Index': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'Value Pick Finder': 'from-green-500/20 to-green-600/10 border-green-500/30',
  'Statistical Edge': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
};

const algorithmIcons: Record<string, string> = {
  'ML Power Index': '🤖',
  'Value Pick Finder': '💎',
  'Statistical Edge': '📊',
};

const algorithmDescriptions: Record<string, string> = {
  'ML Power Index': 'Machine learning algorithm that analyzes historical data, player stats, and team performance trends.',
  'Value Pick Finder': 'Specialized algorithm finding betting value through odds analysis and market inefficiencies.',
  'Statistical Edge': 'Pure statistics-based algorithm using situational spots, weather, and matchup data.',
};

export function ComparisonCard({ algorithm, rank, isLeader }: ComparisonCardProps) {
  const colorClass = algorithmColors[algorithm.algorithmName] || 'from-muted/50 to-muted/30 border-border';
  const icon = algorithmIcons[algorithm.algorithmName] || '📈';
  const description = algorithmDescriptions[algorithm.algorithmName] || 'Algorithm for sports predictions.';

  const getStreakIcon = () => {
    if (algorithm.streak > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (algorithm.streak < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-to-br border-2 transition-all duration-300 hover:shadow-lg",
      colorClass,
      isLeader && "ring-2 ring-yellow-500/50"
    )}>
      {isLeader && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-yellow-500/90 text-yellow-950 gap-1">
            <Trophy className="h-3 w-3" />
            Leader
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-2xl cursor-help">{icon}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium">{algorithm.algorithmName}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <CardTitle className="text-lg">{algorithm.algorithmName}</CardTitle>
            <p className="text-xs text-muted-foreground">Rank #{rank}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Win Rate - Primary Metric */}
        <div className="text-center py-3 bg-background/50 rounded-lg">
          <p className="text-3xl font-bold text-foreground">
            {algorithm.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-background/30 rounded-md p-2 text-center">
            <p className="font-semibold text-foreground">{algorithm.wins}-{algorithm.losses}</p>
            <p className="text-xs text-muted-foreground">Record</p>
          </div>
          <div className="bg-background/30 rounded-md p-2 text-center">
            <p className={cn(
              "font-semibold",
              algorithm.roi > 0 ? "text-green-500" : algorithm.roi < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {algorithm.roi > 0 ? '+' : ''}{algorithm.roi.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">ROI</p>
          </div>
          <div className="bg-background/30 rounded-md p-2 text-center">
            <p className="font-semibold text-foreground">{algorithm.avgConfidence.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Avg Conf</p>
          </div>
          <div className="bg-background/30 rounded-md p-2 text-center flex items-center justify-center gap-1">
            {getStreakIcon()}
            <p className={cn(
              "font-semibold",
              algorithm.streak > 0 ? "text-green-500" : algorithm.streak < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {Math.abs(algorithm.streak)}
            </p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
        </div>
        
        {/* Recent Results */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Recent Results</p>
          <div className="flex gap-1">
            {algorithm.recentResults.slice(0, 10).map((result, i) => (
              <div
                key={i}
                className={cn(
                  "w-6 h-6 rounded text-xs font-bold flex items-center justify-center",
                  result === 'W' 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-red-500/20 text-red-500"
                )}
              >
                {result}
              </div>
            ))}
            {algorithm.recentResults.length === 0 && (
              <span className="text-xs text-muted-foreground">No results yet</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
