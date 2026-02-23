import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Layers, GitBranch, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { EnsembleResult } from "@/domain/prediction/ensembleEngine";

interface EnsembleSummaryProps {
  ensemble: EnsembleResult | null;
  metaSynthesis?: any;
  isLoadingMeta?: boolean;
  homeTeamName: string;
  awayTeamName: string;
}

const EnsembleSummary: React.FC<EnsembleSummaryProps> = ({
  ensemble,
  metaSynthesis,
  isLoadingMeta,
  homeTeamName,
  awayTeamName,
}) => {
  if (!ensemble) return null;

  const consensusPct = Math.round((ensemble.confidence || 50));
  const pick = ensemble.recommended || "Unknown";
  const diversity = ensemble.ensemble?.diversityScore ?? 0;
  const layerContribs = ensemble.ensemble?.layerContributions;
  const pattern = ensemble.ensemble?.sequentialPattern;

  const diversityLabel =
    diversity < 0.05
      ? "Models strongly agree"
      : diversity < 0.15
      ? "Moderate agreement"
      : "Models disagree";

  // Build plain-English layer descriptions
  const layerDescriptions: { name: string; icon: React.ReactNode; description: string }[] = [];

  if (layerContribs) {
    const basePct = Math.round(layerContribs.baseLearners * 100);
    layerDescriptions.push({
      name: "Base Models",
      icon: <Layers className="h-4 w-4" />,
      description: basePct > 55 ? `Strong support for ${pick} (${basePct}% weight)` : `Slight lean toward ${pick} (${basePct}% weight)`,
    });

    const boostPct = Math.round(layerContribs.gradientBoosting * 100);
    layerDescriptions.push({
      name: "Gradient Boosting",
      icon: <TrendingUp className="h-4 w-4" />,
      description: boostPct > 10 ? `Confirms pick with ${boostPct}% adjustment` : "Neutral — not enough signal",
    });

    layerDescriptions.push({
      name: "Sequential Pattern",
      icon: <GitBranch className="h-4 w-4" />,
      description: pattern
        ? pattern.description || (pattern.type === "regression" ? "Warns of possible streak regression" : `${pattern.type} pattern detected`)
        : "No significant pattern detected",
    });

    layerDescriptions.push({
      name: "Diversity Bonus",
      icon: <Shield className="h-4 w-4" />,
      description: diversity < 0.05 ? "Strong consensus adds confidence" : "Mixed signals — proceed with caution",
    });
  }

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
              4 layers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top-level summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">{consensusPct}%</p>
              <p className="text-[10px] text-muted-foreground">Model Consensus</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-bold capitalize">{pick}</p>
              <p className="text-[10px] text-muted-foreground">Predicted Winner</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{diversity.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{diversityLabel}</p>
            </div>
          </div>

          {/* Key factor from meta synthesis */}
          {isLoadingMeta ? (
            <Skeleton className="h-12 w-full" />
          ) : metaSynthesis?.keyInsight ? (
            <div className="p-3 bg-accent/50 rounded-lg border border-accent">
              <p className="text-xs font-medium text-muted-foreground mb-1">Key Factor</p>
              <p className="text-sm">{metaSynthesis.keyInsight}</p>
            </div>
          ) : null}

          {/* Layer breakdown */}
          {layerDescriptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Layer Summary
              </p>
              {layerDescriptions.map((layer, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 bg-muted/30 rounded-lg"
                >
                  <span className="text-muted-foreground mt-0.5">{layer.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{layer.name}</p>
                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnsembleSummary;
