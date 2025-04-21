
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Chart, Trophy, TrendingUp, Snowflake } from "lucide-react";
import { Match, SmartScore } from "@/types/sports";
import { cn } from "@/lib/utils";

interface SmartScoreCardProps {
  match: Match;
}

const SmartScoreCard = ({ match }: SmartScoreCardProps) => {
  const smartScore = match.smartScore;
  
  if (!smartScore) {
    return null;
  }
  
  // Helper function to get color based on score
  const getColorForScore = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    if (score >= 40) return "text-blue-500";
    return "text-red-500";
  };
  
  // Helper function to get background color for progress bar
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    if (score >= 40) return "bg-blue-500";
    return "bg-red-500";
  };
  
  // Helper function to determine confidence display
  const getConfidenceDisplay = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return {
          text: "High Confidence",
          bgColor: "bg-green-500"
        };
      case 'medium':
        return {
          text: "Medium Confidence",
          bgColor: "bg-amber-500"
        };
      case 'low':
        return {
          text: "Low Confidence",
          bgColor: "bg-red-500"
        };
    }
  };
  
  const confidenceDisplay = smartScore.recommendation?.confidence
    ? getConfidenceDisplay(smartScore.recommendation.confidence)
    : { text: "No Recommendation", bgColor: "bg-gray-500" };
  
  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="bg-navy-50 dark:bg-navy-700 p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Chart className="h-5 w-5 text-navy-600" />
            SmartScore™ Analysis
          </CardTitle>
          <div className={cn(
            "font-bold text-lg rounded-full w-12 h-12 flex items-center justify-center",
            getColorForScore(smartScore.overall)
          )}>
            {smartScore.overall}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Value</span>
              <span className={cn("text-sm font-medium", getColorForScore(smartScore.value))}>
                {smartScore.value}
              </span>
            </div>
            <Progress value={smartScore.value} className="h-2" 
              indicatorClassName={getProgressColor(smartScore.value)} />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Momentum</span>
              <span className={cn("text-sm font-medium", getColorForScore(smartScore.momentum))}>
                {smartScore.momentum}
              </span>
            </div>
            <Progress value={smartScore.momentum} className="h-2" 
              indicatorClassName={getProgressColor(smartScore.momentum)} />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Injuries Impact</span>
              <span className={cn("text-sm font-medium", getColorForScore(smartScore.injuries))}>
                {smartScore.injuries}
              </span>
            </div>
            <Progress value={smartScore.injuries} className="h-2" 
              indicatorClassName={getProgressColor(smartScore.injuries)} />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Weather</span>
              <span className={cn("text-sm font-medium", getColorForScore(smartScore.weatherImpact))}>
                {smartScore.weatherImpact}
              </span>
            </div>
            <Progress value={smartScore.weatherImpact} className="h-2" 
              indicatorClassName={getProgressColor(smartScore.weatherImpact)} />
          </div>
          
          {/* Key Factors */}
          <div className="pt-2">
            <h4 className="text-sm font-medium mb-2">Key Factors</h4>
            <div className="flex flex-wrap gap-2">
              {smartScore.factors.slice(0, 3).map((factor) => (
                <Badge 
                  key={factor.key} 
                  variant="outline" 
                  className={cn(
                    "flex items-center gap-1 font-normal",
                    factor.impact === 'positive' ? "text-green-600 border-green-300" :
                    factor.impact === 'negative' ? "text-red-600 border-red-300" :
                    "text-blue-600 border-blue-300"
                  )}
                >
                  {factor.impact === 'positive' && <TrendingUp className="h-3 w-3" />}
                  {factor.impact === 'negative' && <Snowflake className="h-3 w-3" />}
                  <span>{factor.description}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      {smartScore.recommendation && smartScore.recommendation.betOn !== 'none' && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4 border-t">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-gold-500" />
                <span className="font-medium">Recommendation</span>
              </div>
              <Badge className={confidenceDisplay.bgColor}>
                {confidenceDisplay.text}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className="px-3 py-1 font-semibold text-lg capitalize"
              >
                {smartScore.recommendation.betOn === 'home' ? match.homeTeam.shortName :
                 smartScore.recommendation.betOn === 'away' ? match.awayTeam.shortName :
                 smartScore.recommendation.betOn}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {smartScore.recommendation.reasoning}
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default SmartScoreCard;
