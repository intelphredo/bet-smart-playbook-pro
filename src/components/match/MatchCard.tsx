// src/components/match/MatchCard.tsx

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedGame } from "@/hooks/useGames";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, Users, Activity, Target, Clock, Zap, ChevronRight } from "lucide-react";
import { getPrimaryOdds, formatMoneylineOdds } from "@/utils/sportsbook";
import { LiveOdds } from "@/types/sports";
import { useLiveScoresContext } from "@/providers/LiveScoresProvider";
import { LivePulse, StaleDataWarning } from "@/components/ui/LiveScoreIndicators";
import { isMatchLive, isMatchFinished } from "@/utils/matchStatus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchCardProps {
  game: UnifiedGame;
  expanded?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ game, expanded = false }) => {
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

  // Prediction data - check if exists on game object
  const prediction = (game as any).prediction;
  const hasValidPrediction = prediction?.recommended && prediction?.confidence;

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // Get confidence styling
  const getConfidenceStyle = (conf: number) => {
    if (conf >= 70) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (conf >= 60) return 'text-primary bg-primary/10 border-primary/30';
    if (conf >= 55) return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
    return 'text-muted-foreground bg-muted border-muted';
  };

  // Quick factors based on prediction
  const quickFactors = hasValidPrediction ? [
    { icon: TrendingUp, label: 'Momentum', value: prediction.confidence >= 65 ? 'Strong' : 'Mixed' },
    { icon: Target, label: 'Matchup', value: prediction.confidence >= 70 ? 'Favorable' : 'Even' },
  ] : [];

  return (
    <Card variant="premium" className={cn(
      "w-full overflow-hidden transition-all duration-300",
      isLive && "border-red-500/30 ring-1 ring-red-500/20",
      "hover:shadow-lg hover:shadow-primary/5"
    )}>
      {/* Premium gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium">
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
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 space-y-4">
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

        {/* AI Prediction Section */}
        {hasValidPrediction && !isFinished && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">AI Prediction</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getConfidenceStyle(prediction.confidence))}
              >
                {prediction.confidence}% confidence
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{prediction.recommended}</span>
              {prediction.reasoning && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Activity className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {prediction.reasoning}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            
            {/* Confidence Progress */}
            <Progress 
              value={prediction.confidence} 
              className="h-1.5" 
            />
            
            {/* Quick Factors */}
            {quickFactors.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {quickFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <factor.icon className="h-3 w-3" />
                    <span>{factor.label}:</span>
                    <span className="font-medium text-foreground">{factor.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FanDuel Odds Display */}
        {primaryOdds && !isFinished && (
          <div className={cn(
            "rounded-md p-3 border",
            isFanDuel ? "border-primary/30 bg-primary/5" : "border-muted/40 bg-muted/20"
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
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-background/50">
                <span className="text-muted-foreground truncate">{game.homeTeam}</span>
                <span className={cn("font-bold tabular-nums", isFanDuel && "text-primary")}>
                  {formatMoneylineOdds(primaryOdds.homeWin)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-background/50">
                <span className="text-muted-foreground truncate">{game.awayTeam}</span>
                <span className={cn("font-bold tabular-nums", isFanDuel && "text-primary")}>
                  {formatMoneylineOdds(primaryOdds.awayWin)}
                </span>
              </div>
            </div>
            
            {/* Spread if available */}
            {primaryOdds.spread && (
              <div className="mt-2 pt-2 border-t border-muted/30 text-[10px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Spread</span>
                  <span className="font-medium text-foreground">
                    {primaryOdds.spread.homeSpread > 0 ? '+' : ''}{primaryOdds.spread.homeSpread}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-muted/20">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              Updated {lastUpdate 
                ? new Date(lastUpdate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) 
                : new Date(game.lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-primary cursor-pointer hover:underline">
            <span>View details</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;