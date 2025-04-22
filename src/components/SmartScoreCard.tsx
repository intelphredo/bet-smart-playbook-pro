
import React from "react";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ArrowBigUp, 
  ArrowBigDown, 
  Gauge, 
  CloudRain, 
  Activity,
  DollarSign
} from "lucide-react";

interface SmartScoreCardProps {
  match: Match;
  showArbitrageAlert?: boolean;
}

const SmartScoreCard = ({ match, showArbitrageAlert = false }: SmartScoreCardProps) => {
  if (!match.smartScore) return null;
  
  const { 
    overall, 
    components,
    recommendation,
    hasArbitrageOpportunity
  } = match.smartScore;
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 65) return "text-blue-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Determine progress color
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 65) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <Card className={`border ${hasArbitrageOpportunity && showArbitrageAlert ? 'border-red-300 shadow-md' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between py-2 relative">
        <h3 className="text-sm font-semibold">
          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
        </h3>
        <div className="flex items-center gap-1">
          {hasArbitrageOpportunity && showArbitrageAlert && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle size={12} />
              <span className="text-xs">Arbitrage</span>
            </Badge>
          )}
          <Badge variant="outline" className={`${getScoreColor(overall)} border-none`}>
            {overall}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <Progress 
          value={overall} 
          className="h-1.5 mb-3"
          indicatorClassName={getProgressColor(overall)}
        />
        
        <div className="grid grid-cols-3 gap-1 mb-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              <ArrowBigUp size={14} className="mr-0.5" />
              <span>Momentum</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor(components.momentum)}`}>
              {Math.round(components.momentum)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              <Gauge size={14} className="mr-0.5" />
              <span>Value</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor(components.value)}`}>
              {Math.round(components.value)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              <ArrowBigDown size={14} className="mr-0.5" />
              <span>Odds Mvt</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor(components.oddsMovement)}`}>
              {Math.round(components.oddsMovement)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              <CloudRain size={14} className="mr-0.5" />
              <span>Weather</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor(components.weather)}`}>
              {Math.round(components.weather || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              <Activity size={14} className="mr-0.5" />
              <span>Injuries</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor(components.injuries)}`}>
              {Math.round(components.injuries || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              <DollarSign size={14} className="mr-0.5" />
              <span>Arbitrage</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor(components.arbitrage || 0)}`}>
              {Math.round(components.arbitrage || 0)}
            </div>
          </div>
        </div>
        
        {recommendation && recommendation.betOn && (
          <div className="mt-3 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-0.5">Recommendation:</div>
            <div className="text-sm font-semibold">
              {recommendation.betOn} 
              {recommendation.confidence && ` (${recommendation.confidence} confidence)`}
            </div>
          </div>
        )}
        
        {hasArbitrageOpportunity && showArbitrageAlert && (
          <div className="mt-2 flex items-center">
            <AlertTriangle size={14} className="text-red-500 mr-1" />
            <span className="text-xs text-red-500">
              Arbitrage opportunity detected
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartScoreCard;
