import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Layers, GitBranch, TrendingUp, Shield, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { EnsembleResult } from "@/domain/prediction/ensembleEngine";
import { cn } from "@/lib/utils";

interface EnsembleSummaryProps {
  ensemble: EnsembleResult | null;
  metaSynthesis?: any;
  isLoadingMeta?: boolean;
  homeTeamName: string;
  awayTeamName: string;
}

// Map each layer to a 0–100 confidence bar
function getLayerConfidences(ensemble: EnsembleResult) {
  const meta = ensemble.ensemble;
  const lc = meta.layerContributions;

  // baseLearners is raw weighted confidence (0–1 scale, e.g. 0.52)
  const baseConf = Math.max(0, Math.min(100, Math.round(lc.baseLearners * 100)));

  // gradientBoosting is a small adjustment; map to how much it agrees
  // Positive = reinforces pick, negative = contradicts
  const boostRaw = lc.gradientBoosting;
  const boostConf = Math.max(0, Math.min(100, Math.round(50 + boostRaw * 500)));

  // sequentialPattern: positive supports pick, negative warns regression
  const patternRaw = lc.sequentialPattern;
  const patternConf = Math.max(0, Math.min(100, Math.round(50 + patternRaw * 500)));

  // diversityBonus: higher diversity = more robust
  const divRaw = lc.diversityBonus;
  const divConf = Math.max(0, Math.min(100, Math.round(50 + divRaw * 300)));

  return [
    { name: "Base Models", icon: <Layers className="h-4 w-4" />, confidence: baseConf },
    { name: "Trend Booster", icon: <TrendingUp className="h-4 w-4" />, confidence: boostConf },
    { name: "Streak Detector", icon: <GitBranch className="h-4 w-4" />, confidence: patternConf },
    { name: "Agreement Check", icon: <Shield className="h-4 w-4" />, confidence: divConf },
  ];
}

function getBarColor(conf: number) {
  if (conf >= 65) return "bg-emerald-500";
  if (conf >= 45) return "bg-amber-500";
  return "bg-red-500";
}

function getBarTextColor(conf: number) {
  if (conf >= 65) return "text-emerald-500";
  if (conf >= 45) return "text-amber-500";
  return "text-red-500";
}

function getConfidenceIcon(conf: number) {
  if (conf >= 65) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (conf >= 45) return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
}

function getConfidenceLabel(conf: number) {
  if (conf >= 80) return "Very Confident";
  if (conf >= 65) return "Confident";
  if (conf >= 50) return "Leaning";
  if (conf >= 40) return "Uncertain";
  return "Doubtful";
}

// Build a plain English summary
function buildSummary(
  layers: { name: string; confidence: number }[],
  pick: string,
  pattern: any,
  homeTeamName: string,
  awayTeamName: string,
) {
  const supporting = layers.filter(l => l.confidence >= 55).length;
  const teamName = pick.toLowerCase() === "home" ? homeTeamName : pick.toLowerCase() === "away" ? awayTeamName : pick;

  let summary = `${supporting} of 4 models favor ${teamName}`;

  // Add streak concern if pattern is regression
  if (pattern?.type === "regression") {
    summary += ", but streak regression is a concern";
  } else if (pattern?.type === "streak" && pattern?.strength > 0) {
    summary += ", supported by a hot streak";
  } else if (supporting <= 2) {
    summary += " — models are split, proceed with caution";
  }

  return summary;
}

const EnsembleSummary: React.FC<EnsembleSummaryProps> = ({
  ensemble,
  metaSynthesis,
  isLoadingMeta,
  homeTeamName,
  awayTeamName,
}) => {
  if (!ensemble) return null;

  const pick = ensemble.recommended || "Unknown";
  const pattern = ensemble.ensemble?.sequentialPattern;
  const stackedConf = Math.round(ensemble.ensemble?.stackedConfidence ?? 50);
  const layers = getLayerConfidences(ensemble);
  const summary = buildSummary(layers, pick, pattern, homeTeamName, awayTeamName);

  // Consensus strength: average of all layer confidences
  const avgConf = Math.round(layers.reduce((s, l) => s + l.confidence, 0) / layers.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Ensemble Analysis
            <Badge variant="outline" className="text-[10px] ml-auto">
              4 models
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Consensus Strength Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Consensus Strength
              </span>
              <span className={cn("text-sm font-bold", getBarTextColor(avgConf))}>
                {getConfidenceLabel(avgConf)}
              </span>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", getBarColor(avgConf))}
                initial={{ width: 0 }}
                animate={{ width: `${avgConf}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground mix-blend-difference">
                {avgConf}%
              </span>
            </div>
          </div>

          {/* Plain English Summary */}
          <div className="p-3 bg-accent/50 rounded-lg border border-accent">
            <p className="text-sm leading-relaxed">
              💡 {summary}
            </p>
          </div>

          {/* 4 Model Confidence Bars */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Model Breakdown
            </p>
            {layers.map((layer, i) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{layer.icon}</span>
                    <span className="text-xs font-medium">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getConfidenceIcon(layer.confidence)}
                    <span className={cn("text-xs font-bold tabular-nums", getBarTextColor(layer.confidence))}>
                      {layer.confidence}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getBarColor(layer.confidence))}
                    initial={{ width: 0 }}
                    animate={{ width: `${layer.confidence}%` }}
                    transition={{ duration: 0.6, delay: 0.1 * i, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Meta-Synthesis key insight */}
          {isLoadingMeta ? (
            <Skeleton className="h-12 w-full" />
          ) : metaSynthesis?.keyInsight ? (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-1">AI Insight</p>
              <p className="text-sm">{metaSynthesis.keyInsight}</p>
            </div>
          ) : metaSynthesis?.synthesis ? (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-1">AI Insight</p>
              <p className="text-sm">{metaSynthesis.synthesis}</p>
            </div>
          ) : null}

          {/* Clarification */}
          <p className="text-[10px] text-muted-foreground italic px-1">
            The final AI Prediction combines this ensemble with odds, injuries, and calibration adjustments.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnsembleSummary;
