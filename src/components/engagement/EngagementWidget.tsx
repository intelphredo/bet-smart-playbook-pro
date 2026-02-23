import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEngagement } from "@/hooks/useEngagement";
import XPBar from "./XPBar";
import StreakDisplay from "./StreakDisplay";
import DailyChallengesCard from "./DailyChallenges";
import AchievementGrid from "./AchievementGrid";
import AchievementToast from "./AchievementToast";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const EngagementWidget = () => {
  const navigate = useNavigate();
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
      <Card variant="glass">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Achievement toast */}
      <AchievementToast
        achievement={newAchievements[0] || null}
        onDismiss={dismissAchievement}
      />

      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Your Progress
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-primary hover:text-primary"
              onClick={() => navigate("/rewards")}
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {/* XP Bar */}
          <XPBar
            level={data.level}
            current={progress.current}
            needed={progress.needed}
            percent={progress.percent}
            totalXP={data.xp}
            compact
          />

          {/* Streak */}
          <StreakDisplay
            currentStreak={data.currentStreak}
            longestStreak={data.longestStreak}
            compact
          />

          {/* Daily Challenges */}
          <DailyChallengesCard challenges={data.dailyChallenges} compact />

          {/* Achievements preview */}
          <AchievementGrid
            unlocked={unlockedAchievementDefs}
            locked={lockedAchievementDefs}
            compact
            maxDisplay={8}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default EngagementWidget;
