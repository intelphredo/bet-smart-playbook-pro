import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Match } from '@/types/sports';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TeamLogoImage } from '@/components/ui/TeamLogoImage';
import FavoriteButton from '@/components/FavoriteButton';
import PredictionReasoningBadge from '@/components/PredictionReasoningBadge';
import { LockedBadge } from '@/components/ui/LockedBadge';
import { format } from 'date-fns';
import { Clock, Radio, TrendingUp, Zap, ChevronRight, Users, Target } from 'lucide-react';
import { formatMoneylineOdds, getPrimaryOdds } from '@/utils/sportsbook';
import { isMatchLive } from '@/utils/matchStatus';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MemoizedScoreboardRowProps {
  match: Match;
  showOdds?: boolean;
}

// Lightweight version without heavy hooks - optimized for list rendering
const MemoizedScoreboardRow = memo(function MemoizedScoreboardRow({ 
  match, 
  showOdds = true 
}: MemoizedScoreboardRowProps) {
  const navigate = useNavigate();
  
  const isLive = isMatchLive(match.status);
  const isFinished = match.status === 'finished';
  
  // Get FanDuel odds as primary
  const primaryOdds = getPrimaryOdds(match.liveOdds || []);
  
  const formatGameTime = () => {
    if (isLive) return match.score?.period || 'LIVE';
    if (isFinished) return 'Final';
    try {
      return format(new Date(match.startTime), 'h:mm a');
    } catch {
      return '--';
    }
  };

  const getSpread = () => {
    if (!showOdds || !primaryOdds?.spread?.homeSpread) return null;
    const spread = primaryOdds.spread.homeSpread;
    return spread > 0 ? `+${spread}` : spread.toString();
  };

  const getMoneyline = (isHome: boolean) => {
    if (!showOdds || !primaryOdds) return '-';
    const ml = isHome ? primaryOdds.homeWin : primaryOdds.awayWin;
    return formatMoneylineOdds(ml);
  };

  const handleClick = () => {
    navigate(`/game/${match.id}`);
  };

  const homeScore = match.score?.home;
  const awayScore = match.score?.away;
  
  // Prediction data
  const prediction = match.prediction;
  const hasValidPrediction = prediction?.recommended && prediction?.confidence && !isFinished;
  
  // Get confidence level for styling
  const getConfidenceStyle = (conf: number) => {
    if (conf >= 70) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    if (conf >= 60) return 'bg-primary/10 text-primary border-primary/30';
    if (conf >= 55) return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30';
    return 'bg-muted text-muted-foreground border-muted';
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "grid grid-cols-[60px_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 cursor-pointer transition-all",
        "hover:bg-primary/5 border-b border-border/30 last:border-b-0",
        "hover:border-l-2 hover:border-l-primary/50",
        isLive && "bg-cyan-400/5"
      )}
    >
      {/* Time/Status */}
      <div className="text-center">
        {isLive ? (
          <div className="flex flex-col items-center gap-1">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-medium">{match.score?.period || 'LIVE'}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formatGameTime()}</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Away Team */}
        <div className="flex items-center gap-2">
          <TeamLogoImage
            teamName={match.awayTeam?.name || 'Away'}
            logoUrl={match.awayTeam?.logo}
            size="sm"
          />
          <span className={cn(
            "text-sm font-medium truncate",
            isFinished && (awayScore ?? 0) > (homeScore ?? 0) && "font-bold"
          )}>
            {match.awayTeam?.shortName || match.awayTeam?.name || 'Away'}
          </span>
          {(isLive || isFinished) && (
            <span className={cn(
              "ml-auto text-sm font-bold min-w-[24px] text-right tabular-nums",
              isFinished && (awayScore ?? 0) > (homeScore ?? 0) && "text-primary"
            )}>
              {awayScore ?? '--'}
            </span>
          )}
        </div>
        {/* Home Team */}
        <div className="flex items-center gap-2">
          <TeamLogoImage
            teamName={match.homeTeam?.name || 'Home'}
            logoUrl={match.homeTeam?.logo}
            size="sm"
          />
          <span className={cn(
            "text-sm font-medium truncate",
            isFinished && (homeScore ?? 0) > (awayScore ?? 0) && "font-bold"
          )}>
            {match.homeTeam?.shortName || match.homeTeam?.name || 'Home'}
          </span>
          {(isLive || isFinished) && (
            <span className={cn(
              "ml-auto text-sm font-bold min-w-[24px] text-right tabular-nums",
              isFinished && (homeScore ?? 0) > (awayScore ?? 0) && "text-primary"
            )}>
              {homeScore ?? '--'}
            </span>
          )}
        </div>
      </div>

      {/* AI Prediction - Enhanced */}
      {hasValidPrediction && (
        <div className="hidden sm:flex flex-col gap-1 items-end">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] h-5 px-2 cursor-help gap-1",
                    getConfidenceStyle(prediction.confidence)
                  )}
                >
                  <Zap className="h-3 w-3" />
                  {prediction.confidence}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">AI Pick</span>
                    <div className="flex items-center gap-1">
                      {prediction.isLocked && (
                        <LockedBadge lockedAt={prediction.lockedAt} compact />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {prediction.confidence}% conf
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{prediction.recommended}</p>
                  {prediction.reasoning && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {prediction.reasoning}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>Momentum</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-primary" />
                      <span>Matchup</span>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            {prediction.isLocked && (
              <LockedBadge lockedAt={prediction.lockedAt} compact />
            )}
          </div>
          <Progress 
            value={prediction.confidence} 
            className="h-0.5 w-12" 
          />
        </div>
      )}

      {/* Odds */}
      {showOdds && !isFinished && (
        <div className="flex flex-col gap-1 text-right text-xs text-muted-foreground min-w-[50px]">
          <span className="tabular-nums">{getMoneyline(false)}</span>
          <span className="tabular-nums">{getMoneyline(true)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {match.league && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            {match.league}
          </Badge>
        )}
        <FavoriteButton type="match" id={match.id} size="sm" />
        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if match data actually changed
  return (
    prevProps.match.id === nextProps.match.id &&
    prevProps.match.status === nextProps.match.status &&
    prevProps.match.score?.home === nextProps.match.score?.home &&
    prevProps.match.score?.away === nextProps.match.score?.away &&
    prevProps.match.score?.period === nextProps.match.score?.period &&
    prevProps.match.prediction?.confidence === nextProps.match.prediction?.confidence &&
    prevProps.match.prediction?.recommended === nextProps.match.prediction?.recommended &&
    prevProps.match.prediction?.isLocked === nextProps.match.prediction?.isLocked &&
    prevProps.showOdds === nextProps.showOdds
  );
});

export { MemoizedScoreboardRow };
export default MemoizedScoreboardRow;
