/**
 * Small indicator showing when calibration is active and affecting predictions
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gauge, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCalibrationSummary } from "@/utils/modelCalibration/calibrationIntegration";
import { getBinCalibrationSummary } from "@/utils/modelCalibration/binCalibration";
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
  const binSummary = getBinCalibrationSummary();

  if (isLoading) {
    return null;
  }

  if (!summary.isActive && !binSummary.isActive) {
    return null;
  }

  const hasAdjustments = summary.adjustedAlgorithms > 0 || summary.pausedAlgorithms > 0;
  const hasPaused = summary.pausedAlgorithms > 0;
  const hasBinAdjustments = binSummary.adjustedBinsCount > 0;
  const isAutoTuning = hasBinAdjustments && binSummary.overallFactor !== 1.0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs gap-1 cursor-help",
              hasPaused && "border-orange-500/50 text-orange-500",
              !hasPaused && isAutoTuning && "border-cyan-500/50 text-cyan-500",
              hasAdjustments && !hasPaused && !isAutoTuning && "border-blue-500/50 text-blue-500",
              !hasAdjustments && !isAutoTuning && "border-green-500/50 text-green-500",
              className
            )}
          >
            {hasPaused ? (
              <AlertTriangle className="h-3 w-3" />
            ) : isAutoTuning ? (
              <Zap className="h-3 w-3" />
            ) : hasAdjustments ? (
              <Gauge className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {showLabel && (
              <span>
                {hasPaused 
                  ? `${summary.pausedAlgorithms} Paused` 
                  : isAutoTuning
                    ? 'Auto-Tuning'
                    : hasAdjustments 
                      ? 'Calibrated' 
                      : 'Optimal'}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-medium">
              {isAutoTuning ? '🔧 Auto-Tuning Active' : 'Auto-Calibration Active'}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {summary.adjustedAlgorithms} algorithm(s) with adjusted confidence</p>
              <p>• {summary.pausedAlgorithms} algorithm(s) temporarily paused</p>
              <p>• Avg confidence multiplier: ×{summary.averageMultiplier.toFixed(2)}</p>
              {binSummary.isActive && (
                <>
                  <div className="border-t border-border/50 my-1.5 pt-1.5">
                    <p className="font-medium text-foreground">Bin-Level Tuning</p>
                  </div>
                  <p>• {binSummary.adjustedBinsCount} confidence bin(s) auto-adjusted</p>
                  <p>• Overall factor: ×{binSummary.overallFactor.toFixed(2)}</p>
                  {binSummary.worstBin && (
                    <p className="text-orange-400">
                      • Worst bin: {binSummary.worstBin.label} ({binSummary.worstBin.error > 0 ? '+' : ''}{binSummary.worstBin.error.toFixed(1)}% error)
                    </p>
                  )}
                  {binSummary.bestBin && (
                    <p className="text-green-400">
                      • Best bin: {binSummary.bestBin.label} ({binSummary.bestBin.accuracy.toFixed(1)}% accurate)
                    </p>
                  )}
                </>
              )}
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
