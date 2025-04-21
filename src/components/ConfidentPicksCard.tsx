
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, History, Star, TrendingUp, TrendingDown } from "lucide-react";
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
    if (confidence >= 80) return "text-green-500";
    if (confidence >= 65) return "text-amber-500";
    return "text-gray-500";
  };

  const getStreakIcon = () => {
    if (analysis.streakImpact >= 5) return <Flame className="h-4 w-4 text-orange-500" />;
    if (analysis.streakImpact <= -5) return <Snowflake className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getMatchupIcon = () => {
    if (analysis.matchupImpact >= 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (analysis.matchupImpact <= -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <Card className={cn(
      "overflow-hidden border-l-4",
      isHighConfidence ? "border-l-green-500" : 
      isModerateConfidence ? "border-l-amber-500" : "border-l-gray-300"
    )}>
      <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {analysis.playerName}
            {getStreakIcon()}
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {analysis.propType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              <Star className={cn("h-4 w-4", getConfidenceColor(analysis.confidence))} />
              <span className={cn("font-semibold", getConfidenceColor(analysis.confidence))}>
                {analysis.confidence}% Confidence
              </span>
            </div>
            <Badge 
              className={cn(
                "uppercase text-xs",
                analysis.recommendation === "over" ? "bg-green-500" : "bg-red-500"
              )}
            >
              {analysis.recommendation}
            </Badge>
          </div>
          <Progress 
            value={analysis.confidence} 
            className={cn(
              "h-2",
              isHighConfidence ? "bg-green-100" : 
              isModerateConfidence ? "bg-amber-100" : "bg-gray-100"
            )}
          />
        </div>

        {analysis.line && (
          <div className="flex justify-between text-sm mb-3 border-b pb-2">
            <span>Line</span>
            <span className="font-semibold">{analysis.line}</span>
          </div>
        )}

        {analysis.historicalAvg && (
          <div className="flex items-center gap-1 text-sm mb-3">
            <History className="h-4 w-4 text-navy-500" />
            <span>Historical avg: </span>
            <span className="font-semibold">{analysis.historicalAvg.toFixed(1)}</span>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          {analysis.streakImpact !== 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1",
                analysis.streakImpact > 0 ? "text-green-600" : "text-red-600"
              )}
            >
              <span>Streak</span>
              <span>{analysis.streakImpact > 0 ? "+" : ""}{analysis.streakImpact}</span>
            </Badge>
          )}

          {analysis.matchupImpact !== 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1",
                analysis.matchupImpact > 0 ? "text-green-600" : "text-red-600"
              )}
            >
              <span>Matchup</span>
              <span>{analysis.matchupImpact > 0 ? "+" : ""}{analysis.matchupImpact}</span>
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {analysis.reasoning}
        </p>
      </CardContent>
    </Card>
  );
};

export default ConfidentPicksCard;
