// src/components/match/MatchCard.tsx

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedGame } from "@/hooks/useGames";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

interface MatchCardProps {
  game: UnifiedGame;
}

export const MatchCard: React.FC<MatchCardProps> = ({ game }) => {
  const isLive = game.status === "live" || game.status === "in";
  const isFinished = game.status === "finished" || game.status === "post";
  const hasScore = game.score && (game.score.home !== undefined || game.score.away !== undefined);

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  return (
    <Card className={cn(
      "w-full shadow-sm border border-muted/40",
      isLive && "border-red-500/50 bg-red-500/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {game.league || 'SPORTS'}
          </Badge>
          {isLive && (
            <Badge variant="destructive" className="text-xs animate-pulse gap-1">
              <Radio className="h-3 w-3" />
              LIVE
            </Badge>
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-xs">
              Final
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isLive ? (game.score?.period || 'In Progress') : 
             isFinished ? 'Completed' : formatTime(game.startTime)}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {game.source}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4">
        {/* Teams and Scores */}
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Home Team */}
          <div className="text-center">
            <p className={cn(
              "text-sm font-semibold truncate",
              hasScore && isFinished && (game.score?.home || 0) > (game.score?.away || 0) && "text-green-500"
            )}>
              {game.homeTeam}
            </p>
            {hasScore && (
              <p className={cn(
                "text-2xl font-bold mt-1",
                isLive && "text-red-500",
                isFinished && (game.score?.home || 0) > (game.score?.away || 0) && "text-green-500"
              )}>
                {game.score?.home ?? 0}
              </p>
            )}
          </div>

          {/* Center - VS or Score Separator */}
          <div className="text-center">
            {hasScore ? (
              <div className="space-y-1">
                <span className="text-xl font-bold text-muted-foreground">-</span>
                {isLive && game.score?.period && (
                  <p className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {game.score.period}
                  </p>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">vs</span>
            )}
          </div>

          {/* Away Team */}
          <div className="text-center">
            <p className={cn(
              "text-sm font-semibold truncate",
              hasScore && isFinished && (game.score?.away || 0) > (game.score?.home || 0) && "text-green-500"
            )}>
              {game.awayTeam}
            </p>
            {hasScore && (
              <p className={cn(
                "text-2xl font-bold mt-1",
                isLive && "text-red-500",
                isFinished && (game.score?.away || 0) > (game.score?.home || 0) && "text-green-500"
              )}>
                {game.score?.away ?? 0}
              </p>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-3 border-t border-muted/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>Last updated: {new Date(game.lastUpdated).toLocaleTimeString()}</span>
          {game.odds && (
            <span>
              Odds: {typeof game.odds === "string" ? game.odds : "Available"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;