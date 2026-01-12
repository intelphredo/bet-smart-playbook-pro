import React from "react";
import { Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { 
  MapPin, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Zap,
  Target,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface TeamScheduleCardProps {
  match: Match;
  selectedTeamId: string;
}

export const TeamScheduleCard: React.FC<TeamScheduleCardProps> = ({
  match,
  selectedTeamId,
}) => {
  const navigate = useNavigate();
  const isHome = match.homeTeam.id === selectedTeamId;
  const selectedTeam = isHome ? match.homeTeam : match.awayTeam;
  const opponent = isHome ? match.awayTeam : match.homeTeam;

  const matchDate = parseISO(match.startTime);
  const dateLabel = isToday(matchDate)
    ? "Today"
    : isTomorrow(matchDate)
    ? "Tomorrow"
    : format(matchDate, "EEE, MMM d");

  const timeLabel = format(matchDate, "h:mm a");

  // Determine if prediction favors selected team
  const predictionFavorsSelected =
    (isHome && match.prediction?.recommended === "home") ||
    (!isHome && match.prediction?.recommended === "away");

  // Get odds for selected team
  const teamOdds = isHome ? match.odds?.homeWin : match.odds?.awayWin;
  const opponentOdds = isHome ? match.odds?.awayWin : match.odds?.homeWin;

  // Format odds to American format
  const formatOdds = (odds?: number): string => {
    if (!odds) return '--';
    if (odds >= 2) {
      const american = Math.round((odds - 1) * 100);
      return american > 0 ? `+${american}` : `${american}`;
    }
    const american = Math.round(-100 / (odds - 1));
    return `${american}`;
  };

  // Determine if team is favored based on odds
  const isFavored = teamOdds && opponentOdds && teamOdds < opponentOdds;

  // Get smart score if available
  const smartScore = match.smartScore?.overall;

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-l-4",
      predictionFavorsSelected ? "border-l-green-500" : "border-l-muted",
      isHome ? "bg-gradient-to-r from-primary/5 to-transparent" : ""
    )}
    onClick={() => navigate(`/game/${match.id}`)}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold">
              {match.league}
            </Badge>
            <Badge
              variant={isHome ? "default" : "secondary"}
              className="text-xs"
            >
              {isHome ? "🏠 HOME" : "✈️ AWAY"}
            </Badge>
            {smartScore && smartScore >= 70 && (
              <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                <Zap className="h-3 w-3 mr-1" />
                {smartScore}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-medium">{dateLabel}</span>
            <span>•</span>
            <span>{timeLabel}</span>
          </div>
        </div>

        {/* Teams Row */}
        <div className="flex items-center gap-4">
          {/* Selected Team */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img
                src={selectedTeam.logo}
                alt={selectedTeam.name}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              {isFavored && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Target className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{selectedTeam.shortName}</p>
              <p className="text-xs text-muted-foreground">
                {selectedTeam.record || "0-0"}
              </p>
            </div>
          </div>

          {/* Odds Display */}
          <div className="flex flex-col items-center gap-1 px-4">
            <div className="text-xl font-bold font-mono text-primary">
              {formatOdds(teamOdds)}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase">vs</span>
            <div className="text-sm font-mono text-muted-foreground">
              {formatOdds(opponentOdds)}
            </div>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <p className="font-bold text-lg">{opponent.shortName}</p>
              <p className="text-xs text-muted-foreground">
                {opponent.record || "0-0"}
              </p>
            </div>
            <img
              src={opponent.logo}
              alt={opponent.name}
              className="h-12 w-12 object-contain opacity-75"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        </div>

        {/* Prediction & Action Row */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          {/* Prediction Info */}
          {match.prediction ? (
            <div className={cn(
              "flex items-center gap-3",
              predictionFavorsSelected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}>
              {predictionFavorsSelected ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <div>
                <span className="text-sm font-medium">
                  {predictionFavorsSelected
                    ? `${selectedTeam.shortName} favored to win`
                    : `${opponent.shortName} favored`}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">
                    {match.prediction.confidence}% confidence
                  </Badge>
                  {match.prediction.projectedScore && (
                    <Badge variant="secondary" className="text-[10px]">
                      Proj: {isHome
                        ? `${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away}`
                        : `${match.prediction.projectedScore.away} - ${match.prediction.projectedScore.home}`}
                    </Badge>
                  )}
                  {match.prediction.evPercentage && match.prediction.evPercentage > 0 && (
                    <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                      +{match.prediction.evPercentage.toFixed(1)}% EV
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No prediction available</span>
          )}

          {/* Action Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Location indicator */}
        {isHome && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Home Game Advantage</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
