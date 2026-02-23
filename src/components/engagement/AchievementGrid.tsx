import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementDef, UnlockedAchievement } from "@/hooks/useEngagement";
import { Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementGridProps {
  unlocked: AchievementDef[];
  locked: AchievementDef[];
  compact?: boolean;
  maxDisplay?: number;
}

const AchievementGrid = ({ unlocked, locked, compact, maxDisplay }: AchievementGridProps) => {
  const all = [
    ...unlocked.map(a => ({ ...a, isUnlocked: true })),
    ...locked.map(a => ({ ...a, isUnlocked: false })),
  ];

  const display = maxDisplay ? all.slice(0, maxDisplay) : all;
  const remaining = maxDisplay ? all.length - maxDisplay : 0;

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className={cn("pb-2", compact && "p-3 pb-1")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2", compact ? "text-sm" : "text-base")}>
            🏆 Achievements
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {unlocked.length}/{all.length} unlocked
          </span>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "p-3 pt-1")}>
        <div className={cn(
          "grid gap-2",
          compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-5"
        )}>
          {display.map((badge, i) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border text-center cursor-default transition-colors",
                    badge.isUnlocked
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/20 border-border/20 opacity-50"
                  )}
                >
                  <span className={cn("text-xl", !badge.isUnlocked && "grayscale")}>
                    {badge.isUnlocked ? badge.icon : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </span>
                  <span className={cn(
                    "text-[10px] mt-1 leading-tight font-medium truncate w-full",
                    badge.isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {badge.name}
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48">
                <p className="font-medium">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                <p className="text-xs text-primary flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3" /> +{badge.xpReward} XP
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {remaining > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            +{remaining} more achievements
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementGrid;
