import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  stats: {
    liveGames: number;
    upcomingGames: number;
    arbOpportunities: number;
    winRate: number;
    profit: number;
    streak: number;
  };
}

const StatsBar = ({ stats }: StatsBarProps) => {
  const statItems = [
    {
      label: "Live",
      value: stats.liveGames,
      icon: Activity,
      color: stats.liveGames > 0 ? "text-red-500" : "text-muted-foreground",
      bg: stats.liveGames > 0 ? "bg-red-500/10" : "bg-muted/10",
    },
    {
      label: "Upcoming",
      value: stats.upcomingGames,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Arbitrage",
      value: stats.arbOpportunities,
      icon: DollarSign,
      color: stats.arbOpportunities > 0 ? "text-green-500" : "text-muted-foreground",
      bg: stats.arbOpportunities > 0 ? "bg-green-500/10" : "bg-muted/10",
    },
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(0)}%`,
      icon: stats.winRate >= 50 ? TrendingUp : TrendingDown,
      color: stats.winRate >= 50 ? "text-green-500" : "text-red-500",
      bg: stats.winRate >= 50 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "P/L",
      value: `${stats.profit >= 0 ? "+" : ""}$${Math.abs(stats.profit).toFixed(0)}`,
      icon: DollarSign,
      color: stats.profit >= 0 ? "text-green-500" : "text-red-500",
      bg: stats.profit >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Streak",
      value: stats.streak,
      icon: Zap,
      color: stats.streak > 0 ? "text-orange-500" : stats.streak < 0 ? "text-blue-500" : "text-muted-foreground",
      bg: stats.streak > 0 ? "bg-orange-500/10" : stats.streak < 0 ? "bg-blue-500/10" : "bg-muted/10",
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-border/50">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="p-3 md:p-4 text-center hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={cn("p-1 rounded", stat.bg)}>
                  <Icon className={cn("h-3 w-3 md:h-4 md:w-4", stat.color)} />
                </div>
              </div>
              <div className={cn("text-lg md:text-xl font-bold", stat.color)}>
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default StatsBar;
