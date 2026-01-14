import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, History, Star, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PlayerTrendAnalysis } from "@/types/playerAnalytics";
import { cn } from "@/lib/utils";

interface ConfidentPicksCardProps {
  analysis: PlayerTrendAnalysis;
}

const ConfidentPicksCard = ({ analysis }: ConfidentPicksCardProps) => {
  const isHighConfidence = analysis.confidence >= 80;
  const isModerateConfidence = analysis.confidence >= 65 && analysis.confidence < 80;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-500";
    if (confidence >= 65) return "text-primary";
    return "text-muted-foreground";
  };

  const getStreakIcon = () => {
    if (analysis.streakImpact >= 5) return <Flame className="h-4 w-4 text-orange-500 animate-pulse" />;
    if (analysis.streakImpact <= -5) return <Snowflake className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getMatchupIcon = () => {
    if (analysis.matchupImpact >= 5) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (analysis.matchupImpact <= -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <Card 
      variant="premium"
      className={cn(
        "overflow-hidden relative group",
        isHighConfidence && "ring-1 ring-primary/30"
      )}
    >
      {/* Top accent gradient */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        isHighConfidence 
          ? "bg-gradient-to-r from-emerald-500/60 via-emerald-400 to-emerald-500/60" 
          : isModerateConfidence 
            ? "bg-gradient-to-r from-primary/40 via-primary to-primary/40"
            : "bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/40 to-muted-foreground/20"
      )} />

      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </div>

      <CardHeader className="p-3 bg-gradient-to-br from-muted/30 via-transparent to-primary/5 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isHighConfidence && (
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            )}
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {analysis.playerName}
            </span>
            {getStreakIcon()}
          </CardTitle>
          <Badge 
            variant={isHighConfidence ? "gold" : "outline"} 
            className="capitalize"
          >
            {analysis.propType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 relative">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Star className={cn(
                "h-4 w-4 transition-all", 
                getConfidenceColor(analysis.confidence),
                isHighConfidence && "drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
              )} />
              <span className={cn("font-semibold", getConfidenceColor(analysis.confidence))}>
                {analysis.confidence}% Confidence
              </span>
            </div>
            <Badge 
              className={cn(
                "uppercase text-xs font-bold shadow-sm transition-all hover:scale-105",
                analysis.recommendation === "over" 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500" 
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500"
              )}
            >
              {analysis.recommendation}
            </Badge>
          </div>
          <div className="relative">
            <Progress 
              value={analysis.confidence} 
              className={cn(
                "h-2 bg-muted/50",
                isHighConfidence && "[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400",
                isModerateConfidence && "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80",
              )}
            />
            {/* Glow effect for high confidence */}
            {isHighConfidence && (
              <div className="absolute inset-0 h-2 rounded-full bg-emerald-500/20 blur-sm" />
            )}
          </div>
        </div>

        {analysis.line && (
          <div className="flex justify-between text-sm mb-3 border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Line</span>
            <span className="font-semibold">{analysis.line}</span>
          </div>
        )}

        {analysis.historicalAvg && (
          <div className="flex items-center gap-1.5 text-sm mb-3 p-2 rounded-md bg-muted/30">
            <History className="h-4 w-4 text-primary/70" />
            <span className="text-muted-foreground">Historical avg:</span>
            <span className="font-semibold">{analysis.historicalAvg.toFixed(1)}</span>
          </div>
        )}

        <div className="flex gap-2 mb-3 flex-wrap">
          {analysis.streakImpact !== 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1 transition-all hover:scale-105",
                analysis.streakImpact > 0 
                  ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" 
                  : "text-red-600 border-red-500/30 bg-red-500/10"
              )}
            >
              <span>Streak</span>
              <span className="font-bold">{analysis.streakImpact > 0 ? "+" : ""}{analysis.streakImpact}</span>
            </Badge>
          )}

          {analysis.matchupImpact !== 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1 transition-all hover:scale-105",
                analysis.matchupImpact > 0 
                  ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" 
                  : "text-red-600 border-red-500/30 bg-red-500/10"
              )}
            >
              {getMatchupIcon()}
              <span>Matchup</span>
              <span className="font-bold">{analysis.matchupImpact > 0 ? "+" : ""}{analysis.matchupImpact}</span>
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {analysis.reasoning}
        </p>
      </CardContent>
    </Card>
  );
};

export default ConfidentPicksCard;
