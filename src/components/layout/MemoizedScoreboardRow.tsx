import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Match } from '@/types/sports';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TeamLogoImage } from '@/components/ui/TeamLogoImage';
import FavoriteButton from '@/components/FavoriteButton';
import { format } from 'date-fns';
import { Clock, Radio } from 'lucide-react';
import { formatMoneylineOdds, getPrimaryOdds } from '@/utils/sportsbook';
import { isMatchLive } from '@/utils/matchStatus';

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

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "grid grid-cols-[60px_1fr_auto_auto] gap-3 items-center px-4 py-3 cursor-pointer transition-all",
        "hover:bg-primary/5 border-b border-border/30 last:border-b-0",
        isLive && "bg-destructive/5"
      )}
    >
      {/* Time/Status */}
      <div className="text-center">
        {isLive ? (
          <div className="flex flex-col items-center gap-1">
            <Radio className="h-3 w-3 text-destructive animate-pulse" />
            <span className="text-[10px] text-destructive font-medium">{match.score?.period || 'LIVE'}</span>
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
              "ml-auto text-sm font-bold min-w-[24px] text-right",
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
              "ml-auto text-sm font-bold min-w-[24px] text-right",
              isFinished && (homeScore ?? 0) > (awayScore ?? 0) && "text-primary"
            )}>
              {homeScore ?? '--'}
            </span>
          )}
        </div>
      </div>

      {/* Odds */}
      {showOdds && !isFinished && (
        <div className="flex flex-col gap-1 text-right text-xs text-muted-foreground min-w-[50px]">
          <span>{getMoneyline(false)}</span>
          <span>{getMoneyline(true)}</span>
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
    prevProps.showOdds === nextProps.showOdds
  );
});

export { MemoizedScoreboardRow };
export default MemoizedScoreboardRow;
