// src/components/match/MatchCard.tsx

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedGame } from "@/hooks/useGames";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { getPrimaryOdds, formatMoneylineOdds } from "@/utils/sportsbook";
import { LiveOdds } from "@/types/sports";
import { useLiveScoresContext } from "@/providers/LiveScoresProvider";
import { LivePulse, StaleDataWarning } from "@/components/ui/LiveScoreIndicators";
import { isMatchLive, isMatchFinished } from "@/utils/matchStatus";

interface MatchCardProps {
  game: UnifiedGame;
}

export const MatchCard: React.FC<MatchCardProps> = ({ game }) => {
  // Use live scores context for real-time updates
  const { getUpdatedScore, getPeriod, isStale, getLastUpdate, hasLiveData } = useLiveScoresContext();
  
  // Check live/finished status using centralized utilities
  const isLive = isMatchLive(game.status);
  const isFinished = isMatchFinished(game.status);
  
  // Get updated score from live scores system (falls back to game.score)
  const score = getUpdatedScore(game.id, game.score);
  const period = getPeriod(game.id, game.score?.period);
  const hasScore = score.home !== undefined || score.away !== undefined;
  const isDataStale = isStale(game.id);
  const lastUpdate = getLastUpdate(game.id);
  const hasLive = hasLiveData(game.id);

  // Parse odds if available
  const liveOdds: LiveOdds[] = game.odds && typeof game.odds === 'object' && Array.isArray(game.odds) 
    ? game.odds as LiveOdds[]
    : [];
  const primaryOdds = getPrimaryOdds(liveOdds);
  const isFanDuel = primaryOdds?.sportsbook.id.toLowerCase().includes('fanduel');

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  return (
    <Card variant="premium" className={cn(
      "w-full overflow-hidden",
      isLive && "border-red-500/30 ring-1 ring-red-500/20"
    )}>
      {/* Premium gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {game.league || 'SPORTS'}
          </Badge>
          {isLive && (
            <LivePulse isLive={true} size="sm" showLabel className="ml-1" />
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-xs">
              Final
            </Badge>
          )}
          {isLive && isDataStale && (
            <StaleDataWarning lastUpdate={lastUpdate} size="sm" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isLive ? (period || 'In Progress') : 
             isFinished ? 'Completed' : formatTime(game.startTime)}
          </span>
          {hasLive && (
            <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600">
              LIVE DATA
            </Badge>
          )}
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
              hasScore && isFinished && score.home > score.away && "text-green-500"
            )}>
              {game.homeTeam}
            </p>
            {hasScore && (
              <p className={cn(
                "text-2xl font-bold mt-1 tabular-nums transition-all",
                isLive && "text-red-500",
                isFinished && score.home > score.away && "text-green-500"
              )}>
                {score.home}
              </p>
            )}
          </div>

          {/* Center - VS or Score Separator */}
          <div className="text-center">
            {hasScore ? (
              <div className="space-y-1">
                <span className="text-xl font-bold text-muted-foreground">-</span>
                {isLive && period && (
                  <p className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {period}
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
              hasScore && isFinished && score.away > score.home && "text-green-500"
            )}>
              {game.awayTeam}
            </p>
            {hasScore && (
              <p className={cn(
                "text-2xl font-bold mt-1 tabular-nums transition-all",
                isLive && "text-red-500",
                isFinished && score.away > score.home && "text-green-500"
              )}>
                {score.away}
              </p>
            )}
          </div>
        </div>

        {/* FanDuel Odds Display */}
        {primaryOdds && !isFinished && (
          <div className={cn(
            "mt-4 pt-3 border-t rounded-md p-2",
            isFanDuel ? "border-primary/30 bg-primary/5" : "border-muted/40"
          )}>
            <div className="flex items-center gap-1 mb-2">
              {isFanDuel && <Star className="h-3 w-3 text-primary fill-primary" />}
              <span className={cn("text-[10px] font-medium", isFanDuel ? "text-primary" : "text-muted-foreground")}>
                {primaryOdds.sportsbook.name}
              </span>
              {isFanDuel && (
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-primary/30 text-primary ml-1">
                  Primary
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{game.homeTeam}</span>
                <span className={cn("font-bold tabular-nums", isFanDuel && "text-primary")}>
                  {formatMoneylineOdds(primaryOdds.homeWin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{game.awayTeam}</span>
                <span className={cn("font-bold tabular-nums", isFanDuel && "text-primary")}>
                  {formatMoneylineOdds(primaryOdds.awayWin)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-4 pt-3 border-t border-muted/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Last updated: {lastUpdate 
              ? new Date(lastUpdate).toLocaleTimeString() 
              : new Date(game.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;