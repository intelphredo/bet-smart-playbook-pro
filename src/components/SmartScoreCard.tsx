import React, { useState } from "react";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  ArrowBigUp, 
  ArrowBigDown, 
  Gauge, 
  CloudRain, 
  Activity,
  DollarSign,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import { InfoExplainer } from "@/components/ui/InfoExplainer";

interface SmartScoreCardProps {
  match: Match;
  showArbitrageAlert?: boolean;
}

const SmartScoreCard = ({ match, showArbitrageAlert = false }: SmartScoreCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!match.smartScore) return null;
  
  const { 
    overall, 
    components,
    recommendation,
    hasArbitrageOpportunity
  } = match.smartScore;
  
  // Determine color based on score - gold accents for high scores
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 65) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };
  
  // Determine progress color - gold for high scores
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-primary to-accent";
    if (score >= 65) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };
  
  return (
    <>
      <Card 
        className={`border cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] premium-card ${hasArbitrageOpportunity && showArbitrageAlert ? 'border-primary/50 shadow-md' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between py-2 relative">
          <h3 className="text-sm font-semibold">
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </h3>
          <div className="flex items-center gap-1">
            {hasArbitrageOpportunity && showArbitrageAlert && (
              <Badge variant="gold" className="flex items-center gap-1">
                <AlertTriangle size={12} />
                <span className="text-xs">Arbitrage</span>
              </Badge>
            )}
            <Badge 
              variant={overall >= 80 ? "gold-solid" : overall >= 65 ? "gold" : "outline"} 
              className={overall < 65 ? getScoreColor(overall) : ""}
            >
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
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-0.5">
                <ArrowBigUp size={14} />
                <span>Momentum</span>
                <InfoExplainer term="momentum" size="sm" />
              </div>
              <div className={`text-sm font-medium ${getScoreColor(components.momentum)}`}>
                {Math.round(components.momentum)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-0.5">
                <Gauge size={14} />
                <span>Value</span>
                <InfoExplainer term="expected_value" size="sm" />
              </div>
              <div className={`text-sm font-medium ${getScoreColor(components.value)}`}>
                {Math.round(components.value)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-0.5">
                <ArrowBigDown size={14} />
                <span>Odds Mvt</span>
                <InfoExplainer term="line_movement" size="sm" />
              </div>
              <div className={`text-sm font-medium ${getScoreColor(components.oddsMovement)}`}>
                {Math.round(components.oddsMovement)}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <ExternalLink className="h-3 w-3" />
            Click for details
          </div>
        </CardContent>
      </Card>

      {/* Match Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {match.homeTeam.name} vs {match.awayTeam.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                SmartScore™
                <InfoExplainer term="smart_score" size="sm" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(overall)}`}>{overall}</div>
              <Progress 
                value={overall} 
                className="h-2 mt-3"
                indicatorClassName={getProgressColor(overall)}
              />
            </div>

            {/* Component Scores */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg border text-center">
                <ArrowBigUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Momentum</div>
                <div className={`text-lg font-bold ${getScoreColor(components.momentum)}`}>
                  {Math.round(components.momentum)}
                </div>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <Gauge className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Value</div>
                <div className={`text-lg font-bold ${getScoreColor(components.value)}`}>
                  {Math.round(components.value)}
                </div>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <ArrowBigDown className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Odds Mvt</div>
                <div className={`text-lg font-bold ${getScoreColor(components.oddsMovement)}`}>
                  {Math.round(components.oddsMovement)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg border text-center">
                <CloudRain className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Weather</div>
                <div className={`text-lg font-bold ${getScoreColor(components.weather || 0)}`}>
                  {Math.round(components.weather || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <Activity className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Injuries</div>
                <div className={`text-lg font-bold ${getScoreColor(components.injuries || 0)}`}>
                  {Math.round(components.injuries || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Arbitrage</div>
                <div className={`text-lg font-bold ${getScoreColor(components.arbitrage || 0)}`}>
                  {Math.round(components.arbitrage || 0)}
                </div>
              </div>
            </div>
            
            {/* Recommendation */}
            {recommendation && recommendation.betOn && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20">
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  AI Recommendation
                </h4>
                <p className="text-lg font-bold text-primary">
                  {recommendation.betOn} 
                  {recommendation.confidence && ` (${recommendation.confidence} confidence)`}
                </p>
                {recommendation.reasoning && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {recommendation.reasoning}
                  </p>
                )}
              </div>
            )}
            
            {hasArbitrageOpportunity && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">Arbitrage Opportunity Detected</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This match has odds that may allow for risk-free profit across different sportsbooks.
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmartScoreCard;
