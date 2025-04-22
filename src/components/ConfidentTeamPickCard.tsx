import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChartLine } from "lucide-react";
import { Match } from "@/types";

interface ConfidentTeamPickCardProps {
  match: Match;
}

const ConfidentTeamPickCard = ({ match }: ConfidentTeamPickCardProps) => {
  if (!match.prediction) return null;
  const { recommended, confidence, projectedScore } = match.prediction;

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-green-500">
      <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
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
              <Badge className="flex items-center gap-1 bg-blue-500 text-white"><ChartLine className="h-3 w-3" />SmartScore {match.smartScore.overall}</Badge>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          Projected: {projectedScore.home} - {projectedScore.away}
        </div>
        <div className="text-xs text-muted-foreground">
          {recommended === "home" 
            ? `Algorithm favors ${match.homeTeam.name}`
            : recommended === "away"
              ? `Algorithm favors ${match.awayTeam.name}`
              : `Algorithm predicts a draw`
          }
          {match.smartScore && match.smartScore.recommendation?.reasoning 
            ? ` — ${match.smartScore.recommendation.reasoning}` 
            : ""}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfidentTeamPickCard;
