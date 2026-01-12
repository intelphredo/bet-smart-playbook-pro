// ESPN-style compact match row for scoreboard views
import { Match } from '@/types/sports';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Clock, Radio } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SharpMoneyBadge from '@/components/MatchCard/SharpMoneyBadge';

interface ScoreboardRowProps {
  match: Match;
  showOdds?: boolean;
}

export function ScoreboardRow({ match, showOdds = true }: ScoreboardRowProps) {
  const navigate = useNavigate();
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const formatGameTime = () => {
    if (isLive) return match.score?.period || 'LIVE';
    if (isFinished) return 'Final';
    
    try {
      const date = parseISO(match.startTime);
      return format(date, 'h:mm a');
    } catch {
      return match.startTime;
    }
  };

  const getSpread = () => {
    const odds = match.liveOdds?.[0];
    if (!odds?.spread) return null;
    const homeSpread = odds.spread.homeSpread;
    return homeSpread > 0 ? `+${homeSpread}` : homeSpread.toString();
  };

  const getMoneyline = (isHome: boolean) => {
    const odds = match.liveOdds?.[0];
    if (!odds) return null;
    const ml = isHome ? odds.homeWin : odds.awayWin;
    return ml > 0 ? `+${ml}` : ml.toString();
  };

  const homeWinning = (match.score?.home || 0) > (match.score?.away || 0);
  const awayWinning = (match.score?.away || 0) > (match.score?.home || 0);

  return (
    <div 
      onClick={() => navigate(`/game/${match.id}`)}
      className={cn(
        "grid grid-cols-12 items-center gap-2 p-3 border-b hover:bg-accent/50 cursor-pointer transition-colors",
        isLive && "bg-red-500/5 border-l-2 border-l-red-500"
      )}
    >
      {/* Status/Time - 2 cols */}
      <div className="col-span-2 flex flex-col items-center">
        {isLive ? (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 animate-pulse">
            <Radio className="h-2.5 w-2.5 mr-1" />
            LIVE
          </Badge>
        ) : isFinished ? (
          <span className="text-xs text-muted-foreground font-medium">Final</span>
        ) : (
          <span className="text-xs text-muted-foreground">{formatGameTime()}</span>
        )}
        {isLive && match.score?.period && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{match.score.period}</span>
        )}
      </div>

      {/* Teams & Scores - 6 cols */}
      <div className="col-span-6 space-y-1">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {match.awayTeam?.logo && (
              <img src={match.awayTeam.logo} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className={cn(
              "text-sm truncate",
              awayWinning && isFinished && "font-bold"
            )}>
              {match.awayTeam?.shortName || match.awayTeam?.name || 'Away'}
            </span>
          </div>
          <span className={cn(
            "text-sm tabular-nums ml-2",
            awayWinning && isFinished && "font-bold"
          )}>
            {match.score?.away ?? '-'}
          </span>
        </div>
        
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {match.homeTeam?.logo && (
              <img src={match.homeTeam.logo} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className={cn(
              "text-sm truncate",
              homeWinning && isFinished && "font-bold"
            )}>
              {match.homeTeam?.shortName || match.homeTeam?.name || 'Home'}
            </span>
          </div>
          <span className={cn(
            "text-sm tabular-nums ml-2",
            homeWinning && isFinished && "font-bold"
          )}>
            {match.score?.home ?? '-'}
          </span>
        </div>
      </div>

      {/* Odds - 2 cols */}
      {showOdds && (
        <div className="col-span-2 text-center space-y-1">
          <div className="text-xs text-muted-foreground">{getMoneyline(false) || '-'}</div>
          <div className="text-xs text-muted-foreground">{getMoneyline(true) || '-'}</div>
        </div>
      )}

      {/* Sharp/Badges - 2 cols */}
      <div className="col-span-2 flex justify-end">
        <SharpMoneyBadge
          matchId={match.id}
          homeTeam={match.homeTeam?.name || ''}
          awayTeam={match.awayTeam?.name || ''}
          league={match.league}
          compact
        />
      </div>
    </div>
  );
}

export default ScoreboardRow;
