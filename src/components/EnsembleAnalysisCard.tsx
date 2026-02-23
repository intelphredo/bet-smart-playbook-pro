import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Layers, TrendingUp, GitBranch, Shield, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnsembleResult } from "@/domain/prediction/ensembleEngine";
import { MetaSynthesis } from "@/services/prediction/ensembleService";
import { motion } from "framer-motion";

interface EnsembleAnalysisCardProps {
  ensemble: EnsembleResult | null;
  metaSynthesis?: MetaSynthesis;
  isLoadingMeta?: boolean;
}

function getLayerConfidences(ensemble: EnsembleResult) {
  const lc = ensemble.ensemble.layerContributions;
  const baseConf = Math.max(0, Math.min(100, Math.round(lc.baseLearners * 100)));
  const boostConf = Math.max(0, Math.min(100, Math.round(50 + lc.gradientBoosting * 500)));
  const patternConf = Math.max(0, Math.min(100, Math.round(50 + lc.sequentialPattern * 500)));
  const divConf = Math.max(0, Math.min(100, Math.round(50 + lc.diversityBonus * 300)));

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

const EnsembleAnalysisCard: React.FC<EnsembleAnalysisCardProps> = ({
  ensemble,
  metaSynthesis,
  isLoadingMeta,
}) => {
  if (!ensemble) return null;

  const layers = getLayerConfidences(ensemble);
  const avgConf = Math.round(layers.reduce((s, l) => s + l.confidence, 0) / layers.length);
  const pattern = ensemble.ensemble.sequentialPattern;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Ensemble Analysis
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            4 Models
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Consensus Meter */}
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

        <Separator />

        {/* Model Bars */}
        <div className="space-y-3">
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

        {/* Pattern & Diversity quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-0.5">Pattern</p>
            <p className="text-sm font-semibold capitalize">
              {pattern.type === "none" ? "No Pattern" : pattern.type}
            </p>
            {pattern.type !== "none" && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{pattern.description}</p>
            )}
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-0.5">Stacked Confidence</p>
            <p className="text-sm font-semibold">
              {Math.round(ensemble.ensemble.stackedConfidence)}%
            </p>
          </div>
        </div>

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
                AI Summary
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {metaSynthesis.synthesis}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  Edge: <span className="ml-1 font-semibold capitalize">{metaSynthesis.edgeStrength}</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Regression Risk: <span className="ml-1 capitalize">{metaSynthesis.regressionRisk}</span>
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnsembleAnalysisCard;
