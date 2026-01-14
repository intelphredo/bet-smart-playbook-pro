import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type MovementDirection = 'up' | 'down' | 'stable';

interface OddsMovementIndicatorProps {
  direction: MovementDirection;
  change?: number;
  compact?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function OddsMovementIndicator({ 
  direction, 
  change,
  compact = false,
  showTooltip = true,
  className 
}: OddsMovementIndicatorProps) {
  if (direction === 'stable') {
    return compact ? null : (
      <Minus className={cn("h-3 w-3 text-muted-foreground/50", className)} />
    );
  }

  const isUp = direction === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  
  // For betting odds: up means odds increased (worse value for bettor), down means odds decreased (better value)
  // Green = better for bettor (odds going down/shortening), Red = worse for bettor (odds going up/drifting)
  const colorClass = isUp ? "text-red-500" : "text-green-500";
  const bgClass = isUp ? "bg-red-500/10" : "bg-green-500/10";
  
  const indicator = (
    <div className={cn(
      "inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 transition-all",
      bgClass,
      compact ? "scale-90" : "",
      className
    )}>
      <Icon className={cn("h-3 w-3", colorClass, isUp ? "animate-pulse" : "")} />
      {change !== undefined && Math.abs(change) > 0.01 && !compact && (
        <span className={cn("text-[10px] font-medium tabular-nums", colorClass)}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}
        </span>
      )}
    </div>
  );

  if (!showTooltip || !change) return indicator;

  const tooltipText = isUp 
    ? `Odds drifting (+${Math.abs(change).toFixed(2)}) - less value`
    : `Odds shortening (${change.toFixed(2)}) - more action`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Animation keyframes for the pulsing effect
export function OddsFlashIndicator({ 
  isNew,
  direction 
}: { 
  isNew: boolean;
  direction: MovementDirection;
}) {
  if (!isNew || direction === 'stable') return null;
  
  const isUp = direction === 'up';
  
  return (
    <span className={cn(
      "absolute -top-1 -right-1 h-2 w-2 rounded-full animate-ping",
      isUp ? "bg-red-500" : "bg-green-500"
    )} />
  );
}

export default OddsMovementIndicator;
