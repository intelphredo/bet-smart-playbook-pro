import React from "react";
import { Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { MapPin, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamScheduleCardProps {
  match: Match;
  selectedTeamId: string;
}

export const TeamScheduleCard: React.FC<TeamScheduleCardProps> = ({
  match,
  selectedTeamId,
}) => {
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

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {match.league}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dateLabel} • {timeLabel}
            </span>
          </div>
          <Badge
            variant={isHome ? "default" : "secondary"}
            className="text-xs"
          >
            {isHome ? "HOME" : "AWAY"}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Selected Team */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className="h-10 w-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div>
              <p className="font-semibold">{selectedTeam.shortName}</p>
              <p className="text-xs text-muted-foreground">
                {selectedTeam.record || "0-0"}
              </p>
            </div>
          </div>

          {/* VS */}
          <div className="text-sm font-medium text-muted-foreground">vs</div>

          {/* Opponent */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <p className="font-semibold">{opponent.shortName}</p>
              <p className="text-xs text-muted-foreground">
                {opponent.record || "0-0"}
              </p>
            </div>
            <img
              src={opponent.logo}
              alt={opponent.name}
              className="h-10 w-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        </div>

        {/* Prediction */}
        {match.prediction && (
          <div
            className={cn(
              "mt-3 pt-3 border-t flex items-center justify-between",
              predictionFavorsSelected
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                {predictionFavorsSelected
                  ? `${selectedTeam.shortName} favored`
                  : `${opponent.shortName} favored`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {match.prediction.confidence}% confidence
              </span>
              {match.prediction.projectedScore && (
                <Badge variant="outline" className="text-xs">
                  {isHome
                    ? `${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away}`
                    : `${match.prediction.projectedScore.away} - ${match.prediction.projectedScore.home}`}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Location indicator */}
        {isHome && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Home Game</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
