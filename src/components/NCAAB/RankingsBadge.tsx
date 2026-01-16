import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RankingsBadgeProps {
  rank: number | null;
  previousRank?: number;
  trend?: "up" | "down" | "same" | "new";
  trendAmount?: number;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  className?: string;
}

export const RankingsBadge: React.FC<RankingsBadgeProps> = ({
  rank,
  previousRank,
  trend = "same",
  trendAmount = 0,
  size = "md",
  showTrend = true,
  className,
}) => {
  if (!rank || rank > 25) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-0.5",
    md: "text-sm px-2 py-1 gap-1",
    lg: "text-base px-3 py-1.5 gap-1.5",
  };

  const iconSize = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  const getTrendIcon = () => {
    if (!showTrend || trend === "same") return null;
    
    switch (trend) {
      case "up":
        return <TrendingUp size={iconSize[size]} className="text-green-500" />;
      case "down":
        return <TrendingDown size={iconSize[size]} className="text-red-500" />;
      case "new":
        return <Sparkles size={iconSize[size]} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getBadgeColor = () => {
    if (rank <= 5) return "bg-cyan-400/20 text-cyan-500 dark:text-cyan-400 border-cyan-400/30";
    if (rank <= 10) return "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30";
    if (rank <= 15) return "bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 border-cyan-600/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const tooltipContent = () => {
    let text = `AP #${rank}`;
    if (previousRank && previousRank !== rank) {
      text += ` (was #${previousRank})`;
    }
    if (trend === "new") {
      text += " - New to rankings";
    }
    return text;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center font-semibold border",
              sizeClasses[size],
              getBadgeColor(),
              className
            )}
          >
            <Trophy size={iconSize[size]} className="opacity-70" />
            <span>#{rank}</span>
            {getTrendIcon()}
            {showTrend && trendAmount > 0 && trend !== "new" && (
              <span className={cn(
                "text-xs",
                trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {trend === "up" ? "+" : "-"}{trendAmount}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
