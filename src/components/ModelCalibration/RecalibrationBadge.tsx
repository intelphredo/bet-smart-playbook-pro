/**
 * Compact badge showing recalibration status for an algorithm
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, Pause, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlgorithmTrust } from "@/hooks/useModelRecalibration";

interface RecalibrationBadgeProps {
  algorithmId: string;
  showDetails?: boolean;
  className?: string;
}

export function RecalibrationBadge({ 
  algorithmId, 
  showDetails = false,
  className 
}: RecalibrationBadgeProps) {
  const { trusted, weight, confidenceMultiplier, healthScore, isLoading } = useAlgorithmTrust(algorithmId);

  if (isLoading) {
    return null;
  }

  const isAdjusted = Math.abs(confidenceMultiplier - 1.0) > 0.02;
  const isWeightReduced = weight < 0.28;
  const isWeightBoosted = weight > 0.38;
  const isPaused = weight < 0.1;

  if (!isAdjusted && !isWeightReduced && !isWeightBoosted) {
    return showDetails ? (
      <Badge variant="outline" className={cn("text-xs gap-1", className)}>
        <CheckCircle2 className="h-3 w-3" />
        Normal
      </Badge>
    ) : null;
  }

  const getContent = () => {
    if (isPaused) {
      return {
        icon: <Pause className="h-3 w-3" />,
        label: 'Paused',
        variant: 'destructive' as const,
        tooltip: 'Algorithm paused due to severe underperformance',
      };
    }
    
    if (isWeightReduced) {
      return {
        icon: <ArrowDown className="h-3 w-3" />,
        label: showDetails ? `−${((0.33 - weight) / 0.33 * 100).toFixed(0)}%` : 'Reduced',
        variant: 'outline' as const,
        tooltip: `Weight reduced to ${(weight * 100).toFixed(0)}% due to underperformance`,
      };
    }
    
    if (isWeightBoosted) {
      return {
        icon: <ArrowUp className="h-3 w-3" />,
        label: showDetails ? `+${((weight - 0.33) / 0.33 * 100).toFixed(0)}%` : 'Boosted',
        variant: 'default' as const,
        tooltip: `Weight increased to ${(weight * 100).toFixed(0)}% due to strong performance`,
      };
    }
    
    if (confidenceMultiplier < 0.95) {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        label: showDetails ? `×${confidenceMultiplier.toFixed(2)}` : 'Calibrated',
        variant: 'outline' as const,
        tooltip: `Confidence reduced by ${((1 - confidenceMultiplier) * 100).toFixed(0)}% due to overconfidence`,
      };
    }

    return {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Adjusted',
      variant: 'outline' as const,
      tooltip: 'Minor calibration adjustments applied',
    };
  };

  const content = getContent();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={content.variant} 
            className={cn(
              "text-xs gap-1 cursor-help",
              isPaused && "bg-red-500/10 text-red-500 border-red-500/50",
              isWeightReduced && !isPaused && "text-orange-500 border-orange-500/50",
              isWeightBoosted && "bg-green-500/10 text-green-500 border-green-500/50",
              className
            )}
          >
            {content.icon}
            {content.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{content.tooltip}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Health: {healthScore}/100
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
