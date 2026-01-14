/**
 * Small indicator showing when calibration is active and affecting predictions
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCalibrationSummary } from "@/utils/modelCalibration/calibrationIntegration";
import { useModelRecalibration } from "@/hooks/useModelRecalibration";

interface CalibrationStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function CalibrationStatusIndicator({ 
  className,
  showLabel = true 
}: CalibrationStatusIndicatorProps) {
  // Trigger the recalibration hook to ensure weights are loaded
  const { data, isLoading } = useModelRecalibration({ enabled: true });
  const summary = getCalibrationSummary();

  if (isLoading) {
    return null;
  }

  if (!summary.isActive) {
    return null;
  }

  const hasAdjustments = summary.adjustedAlgorithms > 0 || summary.pausedAlgorithms > 0;
  const hasPaused = summary.pausedAlgorithms > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs gap-1 cursor-help",
              hasPaused && "border-orange-500/50 text-orange-500",
              hasAdjustments && !hasPaused && "border-blue-500/50 text-blue-500",
              !hasAdjustments && "border-green-500/50 text-green-500",
              className
            )}
          >
            {hasPaused ? (
              <AlertTriangle className="h-3 w-3" />
            ) : hasAdjustments ? (
              <Gauge className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {showLabel && (
              <span>
                {hasPaused 
                  ? `${summary.pausedAlgorithms} Paused` 
                  : hasAdjustments 
                    ? 'Calibrated' 
                    : 'Optimal'}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-medium">Auto-Calibration Active</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {summary.adjustedAlgorithms} algorithm(s) with adjusted confidence</p>
              <p>• {summary.pausedAlgorithms} algorithm(s) temporarily paused</p>
              <p>• Avg confidence multiplier: ×{summary.averageMultiplier.toFixed(2)}</p>
            </div>
            {summary.lastUpdate && (
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(summary.lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
