import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
          <div key={i} className="skeleton-card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton-line h-3 w-16" />
              <div className="skeleton-circle h-7 w-7" />
            </div>
            <div className="skeleton-line h-8 w-20 mb-2" />
            <div className="skeleton-line h-3 w-14" />
          </div>
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
            variant="interactive"
            className={cn(
              "bg-card/80 backdrop-blur-sm border-border/50 stat-glow",
              "fade-in",
              index === 0 && "stagger-1",
              index === 1 && "stagger-2",
              index === 2 && "stagger-3",
              index === 3 && "stagger-4"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={cn(
                  "p-1.5 rounded-lg transition-transform duration-200 group-hover:scale-110",
                  stat.bgColor
                )}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
              <div className={cn(
                "text-2xl font-bold tracking-tight animate-number",
                stat.color
              )}>
                {stat.value}
              </div>
              {stat.subValue && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.subValue}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStatsDashboard;
