import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChartLine, ExternalLink } from "lucide-react";
import { Match } from "@/types/sports";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TeamLogoImage } from "@/components/ui/TeamLogoImage";

interface ConfidentTeamPickCardProps {
  match: Match;
}

const ConfidentTeamPickCard = ({ match }: ConfidentTeamPickCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!match.prediction) return null;
  const { recommended, confidence, projectedScore, expectedValue, kellyFraction } = match.prediction;

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const recommendedTeam = recommended === "home" 
    ? match.homeTeam.name 
    : recommended === "away" 
      ? match.awayTeam.name 
      : "Draw";

  return (
    <>
      <Card 
        className="overflow-hidden border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="p-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="flex items-center gap-2">
                <TeamLogoImage
                  teamName={match.homeTeam?.name || "Home"}
                  logoUrl={match.homeTeam?.logo}
                  league={match.league}
                  size="xs"
                />
                <span>{match.homeTeam.shortName}</span>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                <TeamLogoImage
                  teamName={match.awayTeam?.name || "Away"}
                  logoUrl={match.awayTeam?.logo}
                  league={match.league}
                  size="xs"
                />
                <span>{match.awayTeam.shortName}</span>
              </div>
            </CardTitle>
            <Badge variant="outline">{match.league}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge className={`flex items-center gap-1 uppercase text-xs ${getBadgeColor(confidence)}`}>
              <Trophy className="h-3 w-3" />
              {recommended === "home" ? match.homeTeam.shortName : recommended === "away" ? match.awayTeam.shortName : "Draw"}
              &nbsp;{confidence}%
            </Badge>
            {match.smartScore ? (
              <Badge className="flex items-center gap-1 bg-primary text-primary-foreground">
                <ChartLine className="h-3 w-3" />SmartScore {match.smartScore.overall}
              </Badge>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Projected: {projectedScore.home} - {projectedScore.away}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
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
              {match.homeTeam.name} vs {match.awayTeam.name}
              <Badge variant="outline">{match.league}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Prediction Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Algorithm Recommendation
              </h4>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${getBadgeColor(confidence)} text-white`}>
                  {recommendedTeam} ({confidence}% confidence)
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {recommended === "home" 
                  ? `Algorithm favors ${match.homeTeam.name}`
                  : recommended === "away"
                    ? `Algorithm favors ${match.awayTeam.name}`
                    : `Algorithm predicts a draw`
                }
              </p>
            </div>

            {/* Projected Score */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Projected Score</h4>
              <div className="flex justify-center items-center gap-4 text-2xl font-bold">
                <span>{match.homeTeam.shortName}</span>
                <span className="text-primary">{projectedScore.home} - {projectedScore.away}</span>
                <span>{match.awayTeam.shortName}</span>
              </div>
            </div>

            {/* Advanced Metrics */}
            {(expectedValue !== undefined || kellyFraction !== undefined) && (
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Advanced Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {expectedValue !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Expected Value:</span>
                      <span className={`ml-2 font-semibold ${expectedValue > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {expectedValue > 0 ? '+' : ''}{expectedValue.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {kellyFraction !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Kelly Stake:</span>
                      <span className="ml-2 font-semibold">{(kellyFraction * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SmartScore Details */}
            {match.smartScore && (
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ChartLine className="h-4 w-4" />
                  SmartScore Analysis
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 rounded bg-muted/50">
                    <div className="text-muted-foreground text-xs">Momentum</div>
                    <div className="font-bold">{Math.round(match.smartScore.components.momentum)}</div>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/50">
                    <div className="text-muted-foreground text-xs">Value</div>
                    <div className="font-bold">{Math.round(match.smartScore.components.value)}</div>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/50">
                    <div className="text-muted-foreground text-xs">Odds Mvt</div>
                    <div className="font-bold">{Math.round(match.smartScore.components.oddsMovement)}</div>
                  </div>
                </div>
                {match.smartScore.recommendation?.reasoning && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {match.smartScore.recommendation.reasoning}
                  </p>
                )}
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

export default ConfidentTeamPickCard;
