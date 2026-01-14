import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RefreshCw, Radio } from "lucide-react";
import { motion } from "framer-motion";

interface LiveRefreshIndicatorProps {
  hasLiveGames: boolean;
  secondsUntilRefresh: number;
  isFetching: boolean;
  lastRefresh: Date;
  activeInterval: number;
  className?: string;
}

export function LiveRefreshIndicator({
  hasLiveGames,
  secondsUntilRefresh,
  isFetching,
  lastRefresh,
  activeInterval,
  className,
}: LiveRefreshIndicatorProps) {
  const progress = Math.max(0, Math.min(100, (1 - secondsUntilRefresh / (activeInterval / 1000)) * 100));

  if (!hasLiveGames) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <span>Updated {lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-2", className)}
    >
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1.5 pr-1 overflow-hidden relative",
          hasLiveGames && "border-red-500/50 text-red-500"
        )}
      >
        {/* Progress bar background */}
        <div 
          className="absolute inset-0 bg-red-500/10 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
        
        <div className="relative flex items-center gap-1.5">
          {isFetching ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Radio className="h-3 w-3 animate-pulse" />
          )}
          <span className="text-[10px] font-medium">
            {isFetching ? "Updating..." : `Live • ${secondsUntilRefresh}s`}
          </span>
        </div>
      </Badge>
    </motion.div>
  );
}

export default LiveRefreshIndicator;