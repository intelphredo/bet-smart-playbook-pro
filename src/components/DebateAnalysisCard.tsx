import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Shield, AlertTriangle, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DebateResult } from "@/services/prediction/debateService";

interface DebateAnalysisCardProps {
  debate: DebateResult | null;
  isLoading: boolean;
  error: Error | null;
  homeTeam: string;
  awayTeam: string;
}

const agreementConfig = {
  unanimous: { label: "Unanimous", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  strong: { label: "Strong", color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30" },
  split: { label: "Split", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  contested: { label: "Contested", color: "bg-red-500/15 text-red-600 border-red-500/30" },
};

const DebateAnalysisCard: React.FC<DebateAnalysisCardProps> = ({
  debate,
  isLoading,
  error,
  homeTeam,
  awayTeam,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            AI Debate Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !debate) return null;

  const pickLabel = debate.finalPick === "home" ? homeTeam : debate.finalPick === "away" ? awayTeam : "Skip";
  const agreement = agreementConfig[debate.agreementLevel] || agreementConfig.split;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Debate Analysis
          <Badge variant="outline" className={cn("ml-auto text-xs", agreement.color)}>
            {agreement.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Final Pick & Confidence */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <p className="text-xl font-bold text-primary capitalize">{pickLabel}</p>
            <p className="text-xs text-muted-foreground">AI Pick</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold">{Math.round(debate.adjustedConfidence)}%</p>
            <p className="text-xs text-muted-foreground">Adjusted Confidence</p>
          </div>
        </div>

        <Separator />

        {/* Reasoning */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Debate Synthesis</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {debate.reasoning}
          </p>
        </div>

        {/* Key Factor */}
        <div className="p-3 bg-primary/5 border border-primary/15 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Key Factor</span>
          </div>
          <p className="text-sm text-foreground">{debate.keyFactor}</p>
        </div>

        {/* Temporal Insight */}
        {debate.temporalInsight && (
          <div className="text-sm text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-500" />
            <span>{debate.temporalInsight}</span>
          </div>
        )}

        {/* Biases & Risk */}
        {(debate.biasesIdentified?.length > 0 || debate.riskFlag) && (
          <>
            <Separator />
            <div className="space-y-2">
              {debate.biasesIdentified?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Biases Identified:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {debate.biasesIdentified.map((bias, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {bias}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {debate.riskFlag && (
                <div className="flex items-start gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{debate.riskFlag}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DebateAnalysisCard;
