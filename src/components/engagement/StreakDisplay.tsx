import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

const StreakDisplay = ({ currentStreak, longestStreak, compact }: StreakDisplayProps) => {
  const streakLevel =
    currentStreak >= 30 ? "legendary" :
    currentStreak >= 14 ? "epic" :
    currentStreak >= 7 ? "hot" :
    currentStreak >= 3 ? "warm" : "cold";

  const colors = {
    legendary: "text-yellow-400",
    epic: "text-orange-400",
    hot: "text-red-500",
    warm: "text-orange-500",
    cold: "text-muted-foreground",
  };

  const bgColors = {
    legendary: "bg-yellow-500/10",
    epic: "bg-orange-400/10",
    hot: "bg-red-500/10",
    warm: "bg-orange-500/10",
    cold: "bg-muted/10",
  };

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border border-border/50 p-3",
      bgColors[streakLevel],
      compact && "p-2 gap-2"
    )}>
      <motion.div
        animate={currentStreak >= 3 ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Flame className={cn("h-5 w-5", colors[streakLevel], compact && "h-4 w-4")} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold", colors[streakLevel], compact ? "text-sm" : "text-base")}>
          {currentStreak} day streak
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            {currentStreak > 0
              ? `You've followed AI picks ${currentStreak} day${currentStreak === 1 ? '' : 's'} in a row!`
              : "Start your streak today!"
            }
          </p>
        )}
      </div>

      {!compact && (
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className={cn("text-sm font-bold", colors[streakLevel])}>{longestStreak}</p>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;
