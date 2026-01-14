import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Zap, Sparkles } from "lucide-react";
import { useBetTracking } from "@/hooks/useBetTracking";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Animated counter component
function AnimatedNumber({ 
  value, 
  duration = 1000, 
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className
}: { 
  value: number; 
  duration?: number; 
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated && value === displayValue) return;
    
    const startValue = displayValue;
    const startTime = performance.now() + delay;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (currentTime < startTime) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (value - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, delay]);

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue);

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Animated stat card wrapper
function StatCard({ 
  stat, 
  index 
}: { 
  stat: {
    label: string;
    value: number | string;
    numericValue?: number;
    subValue: string | null;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }; 
  index: number;
}) {
  const Icon = stat.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Card 
        variant="premium"
        className={cn(
          "relative overflow-hidden group cursor-pointer",
          "bg-gradient-to-br from-card/90 via-card to-primary/5",
          "border-border/50 hover:border-primary/30",
          "transition-all duration-300"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={isHovered ? { x: "100%" } : { x: "-100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        {/* Glow effect on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          stat.color.includes("green") && "bg-green-500/5",
          stat.color.includes("red") && "bg-red-500/5",
          stat.color.includes("orange") && "bg-orange-500/5",
          stat.color.includes("blue") && "bg-blue-500/5",
          stat.color.includes("primary") && "bg-primary/5"
        )} />

        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
            <motion.div 
              className={cn(
                "p-1.5 rounded-lg relative",
                stat.bgColor
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={cn("h-4 w-4 relative z-10", stat.color)} />
              {/* Icon glow */}
              <div className={cn(
                "absolute inset-0 rounded-lg blur-sm opacity-50",
                stat.bgColor
              )} />
            </motion.div>
          </div>

          <div className="relative">
            {typeof stat.numericValue === "number" ? (
              <AnimatedNumber
                value={stat.numericValue}
                duration={1200}
                delay={index * 100}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
                className={cn("text-2xl font-bold tracking-tight block", stat.color)}
              />
            ) : (
              <motion.span 
                className={cn("text-2xl font-bold tracking-tight block", stat.color)}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
              >
                {stat.value}
              </motion.span>
            )}
          </div>

          {stat.subValue && (
            <motion.p 
              className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
            >
              {stat.subValue}
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
          <motion.div 
            key={i} 
            className="skeleton-card-premium p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton-line h-3 w-16" />
              <div className="skeleton-circle h-7 w-7" />
            </div>
            <div className="skeleton-line h-8 w-20 mb-2" />
            <div className="skeleton-line h-3 w-14" />
          </motion.div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Picks",
      value: todaysStats.totalPicks.toString(),
      numericValue: todaysStats.totalPicks,
      subValue: todaysStats.pending > 0 ? `${todaysStats.pending} pending` : null,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      numericValue: winRate,
      subValue: stats?.total_bets ? `${stats.wins}W - ${stats.losses}L` : null,
      icon: winRate >= 50 ? TrendingUp : TrendingDown,
      color: winRate >= 50 ? "text-emerald-500" : "text-red-500",
      bgColor: winRate >= 50 ? "bg-emerald-500/10" : "bg-red-500/10",
      suffix: "%",
      decimals: 1,
    },
    {
      label: "Total P/L",
      value: `${totalProfit >= 0 ? "+" : ""}$${totalProfit.toFixed(2)}`,
      numericValue: Math.abs(totalProfit),
      subValue: roi !== 0 ? `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}% ROI` : null,
      icon: DollarSign,
      color: totalProfit >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: totalProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      prefix: totalProfit >= 0 ? "+$" : "-$",
      decimals: 2,
    },
    {
      label: "Current Streak",
      value: currentStreak.toString(),
      numericValue: Math.abs(currentStreak),
      subValue: currentStreak > 0 ? "🔥 Hot" : currentStreak < 0 ? "❄️ Cold" : "—",
      icon: currentStreak !== 0 ? Zap : Activity,
      color: currentStreak > 0 ? "text-orange-500" : currentStreak < 0 ? "text-blue-500" : "text-muted-foreground",
      bgColor: currentStreak > 0 ? "bg-orange-500/10" : currentStreak < 0 ? "bg-blue-500/10" : "bg-muted/10",
      prefix: currentStreak > 0 ? "+" : currentStreak < 0 ? "-" : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <AnimatePresence mode="wait">
        {statCards.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default QuickStatsDashboard;
