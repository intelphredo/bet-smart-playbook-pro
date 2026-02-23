import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Layers, TrendingUp, Activity, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnsembleResult } from "@/domain/prediction/ensembleEngine";
import { MetaSynthesis } from "@/services/prediction/ensembleService";

interface EnsembleAnalysisCardProps {
  ensemble: EnsembleResult | null;
  metaSynthesis?: MetaSynthesis;
  isLoadingMeta?: boolean;
}

const EnsembleAnalysisCard: React.FC<EnsembleAnalysisCardProps> = ({
  ensemble,
  metaSynthesis,
  isLoadingMeta,
}) => {
  if (!ensemble) return null;

  const { ensemble: meta } = ensemble;
  const pattern = meta.sequentialPattern;

  const patternColor = {
    streak: "text-emerald-500",
    breakout: "text-cyan-500",
    alternating: "text-amber-500",
    regression: "text-red-500",
    none: "text-muted-foreground",
  }[pattern.type];

  const edgeColor = {
    strong: "bg-emerald-500",
    moderate: "bg-cyan-500",
    slight: "bg-amber-500",
    none: "bg-muted",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-primary" />
          Ensemble Analysis
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            4-Layer Model
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked Confidence vs Consensus */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">
              {Math.round(ensemble.weightedConfidence)}%
            </p>
            <p className="text-xs text-muted-foreground">Consensus</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <p className="text-2xl font-bold text-primary">
              {Math.round(meta.stackedConfidence)}%
            </p>
            <p className="text-xs text-muted-foreground">Ensemble Stacked</p>
          </div>
        </div>

        <Separator />

        {/* Layer Contributions */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Layer Contributions
          </p>
          <div className="space-y-2">
            {[
              { label: "Base Learners", value: meta.layerContributions.baseLearners, color: "bg-primary" },
              { label: "Gradient Boosting", value: meta.layerContributions.gradientBoosting, color: "bg-cyan-500" },
              { label: "Sequential Pattern", value: meta.layerContributions.sequentialPattern, color: "bg-amber-500" },
              { label: "Diversity Bonus", value: meta.layerContributions.diversityBonus, color: "bg-emerald-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", color)}
                    style={{ width: `${Math.min(Math.abs(value) * 100, 100)}%` }}
                  />
                </div>
                <span className={cn("text-xs font-mono w-14 text-right", value > 0 ? "text-emerald-500" : value < 0 ? "text-red-500" : "text-muted-foreground")}>
                  {value > 0 ? "+" : ""}{(value * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sequential Pattern & Diversity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pattern</span>
            </div>
            <p className={cn("text-sm font-semibold capitalize", patternColor)}>
              {pattern.type === "none" ? "No Pattern" : pattern.type}
            </p>
            {pattern.type !== "none" && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {pattern.description}
              </p>
            )}
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Diversity</span>
            </div>
            <p className="text-sm font-semibold">
              {(meta.diversityScore * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {meta.diversityScore > 0.5 ? "High disagreement" : meta.diversityScore > 0.2 ? "Moderate agreement" : "Strong consensus"}
            </p>
          </div>
        </div>

        {/* Calibration Delta */}
        {Math.abs(meta.calibrationDelta) > 0.5 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
            <AlertTriangle className="h-3 w-3" />
            Calibration adjusted confidence by {meta.calibrationDelta > 0 ? "+" : ""}{meta.calibrationDelta.toFixed(1)} pts
          </div>
        )}

        {/* AI Meta-Synthesis */}
        {isLoadingMeta && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {metaSynthesis && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" />
                AI Meta-Synthesis
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {metaSynthesis.synthesis}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  Pick: <span className="ml-1 font-semibold capitalize">{metaSynthesis.metaPick}</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Edge: <span className={cn("ml-1 font-semibold capitalize", edgeColor[metaSynthesis.edgeStrength] ? "text-foreground" : "")}>{metaSynthesis.edgeStrength}</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Pattern: <span className="ml-1 capitalize">{metaSynthesis.patternReliability}</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Regression: <span className="ml-1 capitalize">{metaSynthesis.regressionRisk}</span>
                </Badge>
              </div>
              {metaSynthesis.blindSpots.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Blind spots: </span>
                  {metaSynthesis.blindSpots.join("; ")}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnsembleAnalysisCard;
