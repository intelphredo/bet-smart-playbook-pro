import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface XPBarProps {
  level: number;
  current: number;
  needed: number;
  percent: number;
  totalXP: number;
  compact?: boolean;
}

const XPBar = ({ level, current, needed, percent, totalXP, compact }: XPBarProps) => {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      {/* Level badge */}
      <div className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 border border-primary/30 font-bold text-primary",
        compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
      )}>
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "font-medium text-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            Level {level}
          </span>
          <span className={cn(
            "text-muted-foreground flex items-center gap-1",
            compact ? "text-[10px]" : "text-xs"
          )}>
            <Zap className="h-3 w-3 text-primary" />
            {current}/{needed} XP
          </span>
        </div>

        {/* Progress bar */}
        <div className={cn(
          "w-full rounded-full bg-muted/50 overflow-hidden",
          compact ? "h-1.5" : "h-2"
        )}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default XPBar;
