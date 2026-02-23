import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useEngagement } from "@/hooks/useEngagement";
import XPBar from "@/components/engagement/XPBar";
import StreakDisplay from "@/components/engagement/StreakDisplay";
import DailyChallengesCard from "@/components/engagement/DailyChallenges";
import AchievementGrid from "@/components/engagement/AchievementGrid";
import AchievementToast from "@/components/engagement/AchievementToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, Flame, Target, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const Rewards = () => {
  const {
    data,
    isLoading,
    progress,
    newAchievements,
    dismissAchievement,
    unlockedAchievementDefs,
    lockedAchievementDefs,
  } = useEngagement();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 container px-4 py-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  const statItems = [
    { label: "Total XP", value: data.xp.toLocaleString(), icon: Zap, color: "text-primary" },
    { label: "Current Streak", value: `${data.currentStreak} days`, icon: Flame, color: "text-orange-500" },
    { label: "Achievements", value: `${unlockedAchievementDefs.length}/${unlockedAchievementDefs.length + lockedAchievementDefs.length}`, icon: Trophy, color: "text-yellow-500" },
    { label: "Challenges Done", value: `${data.dailyChallenges.filter(c => c.completed).length}/3`, icon: Target, color: "text-emerald-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <AchievementToast achievement={newAchievements[0] || null} onDismiss={dismissAchievement} />

      <main className="flex-1 container px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Rewards & Progress
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Earn XP, unlock achievements, and complete daily challenges
          </p>
        </div>

        {/* XP Bar */}
        <Card variant="premium">
          <CardContent className="p-5">
            <XPBar
              level={data.level}
              current={progress.current}
              needed={progress.needed}
              percent={progress.percent}
              totalXP={data.xp}
            />
          </CardContent>
        </Card>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statItems.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card variant="glass">
                  <CardContent className="p-4 text-center">
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Streak */}
          <div className="space-y-4">
            <StreakDisplay
              currentStreak={data.currentStreak}
              longestStreak={data.longestStreak}
            />
            <DailyChallengesCard challenges={data.dailyChallenges} />
          </div>

          {/* Achievements */}
          <AchievementGrid
            unlocked={unlockedAchievementDefs}
            locked={lockedAchievementDefs}
          />
        </div>

        {/* Engagement Stats */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Activity Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Predictions Viewed", value: data.stats.predictions_viewed },
                { label: "Sharp Signals Found", value: data.stats.sharp_signals_found },
                { label: "Value Bets Found", value: data.stats.value_bets_found },
                { label: "Bets Placed", value: data.stats.bets_placed },
                { label: "Wins", value: data.stats.wins },
                { label: "AI Picks Followed", value: data.stats.ai_picks_followed },
                { label: "Leagues Explored", value: data.stats.leagues_explored },
                { label: "Days Active", value: data.stats.days_active },
              ].map((item, i) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <PageFooter />
    </div>
  );
};

export default Rewards;
