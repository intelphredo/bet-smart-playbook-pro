import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Zap } from "lucide-react";
import { useBetTracking } from "@/hooks/useBetTracking";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const QuickStatsDashboard = () => {
  const { bets, stats, isLoading } = useBetTracking();

  const todaysStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysBets = bets.filter((bet) => {
      const betDate = new Date(bet.placed_at || bet.created_at || "");
      betDate.setHours(0, 0, 0, 0);
      return betDate.getTime() === today.getTime();
    });

    const pendingToday = todaysBets.filter((b) => b.status === "pending").length;
    const winsToday = todaysBets.filter((b) => b.status === "won").length;
    const lossesToday = todaysBets.filter((b) => b.status === "lost").length;
    const profitToday = todaysBets.reduce((sum, b) => sum + (b.result_profit || 0), 0);

    return {
      totalPicks: todaysBets.length,
      pending: pendingToday,
      wins: winsToday,
      losses: lossesToday,
      profit: profitToday,
    };
  }, [bets]);

  const winRate = stats?.total_bets && stats.total_bets > 0
    ? ((stats.wins || 0) / stats.total_bets) * 100
    : 0;

  const roi = stats?.roi_percentage || 0;
  const totalProfit = stats?.total_profit || 0;
  const currentStreak = stats?.current_streak || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Picks",
      value: todaysStats.totalPicks,
      subValue: todaysStats.pending > 0 ? `${todaysStats.pending} pending` : null,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      subValue: stats?.total_bets ? `${stats.wins}W - ${stats.losses}L` : null,
      icon: winRate >= 50 ? TrendingUp : TrendingDown,
      color: winRate >= 50 ? "text-green-500" : "text-red-500",
      bgColor: winRate >= 50 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Total P/L",
      value: `${totalProfit >= 0 ? "+" : ""}$${totalProfit.toFixed(2)}`,
      subValue: roi !== 0 ? `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}% ROI` : null,
      icon: DollarSign,
      color: totalProfit >= 0 ? "text-green-500" : "text-red-500",
      bgColor: totalProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Current Streak",
      value: currentStreak,
      subValue: currentStreak > 0 ? "🔥 Hot" : currentStreak < 0 ? "❄️ Cold" : "—",
      icon: currentStreak !== 0 ? Zap : Activity,
      color: currentStreak > 0 ? "text-orange-500" : currentStreak < 0 ? "text-blue-500" : "text-muted-foreground",
      bgColor: currentStreak > 0 ? "bg-orange-500/10" : currentStreak < 0 ? "bg-blue-500/10" : "bg-muted/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={cn(
              "bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-200",
              "hover:shadow-md"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </span>
                <div className={cn("p-1.5 rounded-md", stat.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5", stat.color)} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold tracking-tight", stat.color)}>
                {stat.value}
              </div>
              {stat.subValue && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStatsDashboard;
