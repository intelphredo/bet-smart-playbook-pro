// ESPN-style compact match row for scoreboard views
import { Match } from '@/types/sports';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Radio, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SharpMoneyBadge from '@/components/MatchCard/SharpMoneyBadge';
import { formatMoneylineOdds, getPrimaryOdds, PRIMARY_SPORTSBOOK } from '@/utils/sportsbook';
import AnimatedScore from '@/components/ui/AnimatedScore';
import { TeamLogoImage } from '@/components/ui/TeamLogoImage';
import FavoriteButton from '@/components/FavoriteButton';
import { useOddsMovement } from '@/hooks/useOddsMovement';
import { RankingsBadge } from '@/components/NCAAB';
import { useNCAABRankings, getTeamRanking } from '@/hooks/useNCAABRankings';
import { isMatchLive } from '@/utils/matchStatus';

interface ScoreboardRowProps {
  match: Match;
  showOdds?: boolean;
}

export function ScoreboardRow({ match, showOdds = true }: ScoreboardRowProps) {
  const navigate = useNavigate();
  const isLive = isMatchLive(match.status);
  const isFinished = match.status === 'finished';
  const isNCAAB = match.league === 'NCAAB';
  
  // Get NCAAB rankings for team badges
  const { data: rankings } = useNCAABRankings();
  const homeRank = isNCAAB ? getTeamRanking(rankings, match.homeTeam?.name || '') : null;
  const awayRank = isNCAAB ? getTeamRanking(rankings, match.awayTeam?.name || '') : null;
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

  // Get FanDuel odds as primary
  const primaryOdds = getPrimaryOdds(match.liveOdds || []);
  const isFanDuel = primaryOdds?.sportsbook.id.toLowerCase().includes('fanduel');
  const movement = useOddsMovement(match.id, match.liveOdds);

  const getSpread = () => {
    if (!primaryOdds?.spread) return null;
    const homeSpread = primaryOdds.spread.homeSpread;
    return homeSpread > 0 ? `+${homeSpread}` : homeSpread.toString();
  };

  const getMoneyline = (isHome: boolean) => {
    if (!primaryOdds) return '-';
    const ml = isHome ? primaryOdds.homeWin : primaryOdds.awayWin;
    return formatMoneylineOdds(ml);
  };

  const getMovementIcon = (isHome: boolean) => {
    if (!movement) return null;
    const direction = isHome ? movement.homeDirection : movement.awayDirection;
    if (direction === 'stable') return null;
    
    const isUp = direction === 'up';
    // Green = shortening (better for bettor), Red = drifting (worse)
    return isUp ? (
      <TrendingUp className="h-2.5 w-2.5 text-red-500 animate-pulse" />
    ) : (
      <TrendingDown className="h-2.5 w-2.5 text-green-500" />
    );
  };

  // Show scores for live and finished games, not for scheduled
  const showScores = isLive || isFinished;
  const homeScore = match.score?.home ?? 0;
  const awayScore = match.score?.away ?? 0;
  const homeWinning = homeScore > awayScore;
  const awayWinning = awayScore > homeScore;

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
      <div className="col-span-6 space-y-1.5">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {awayRank && <RankingsBadge rank={awayRank} size="sm" showTrend={false} />}
            <TeamLogoImage
              teamName={match.awayTeam?.name || 'Away'}
              teamId={match.awayTeam?.id}
              logoUrl={match.awayTeam?.logo}
              league={match.league}
              size="xs"
              className="flex-shrink-0"
            />
            <span className={cn(
              "text-sm truncate",
              awayWinning && isFinished && "font-bold"
            )}>
              {match.awayTeam?.shortName || match.awayTeam?.name || 'Away'}
            </span>
          </div>
          {showScores ? (
            <AnimatedScore
              score={awayScore}
              matchId={match.id}
              teamKey="away"
              isLive={isLive}
              className={cn(
                "text-sm ml-2",
                isLive && "text-destructive",
                awayWinning && isFinished && "text-green-500"
              )}
            />
          ) : (
            <span className="text-sm tabular-nums ml-2 font-medium">-</span>
          )}
        </div>
        
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {homeRank && <RankingsBadge rank={homeRank} size="sm" showTrend={false} />}
            <TeamLogoImage
              teamName={match.homeTeam?.name || 'Home'}
              teamId={match.homeTeam?.id}
              logoUrl={match.homeTeam?.logo}
              league={match.league}
              size="xs"
              className="flex-shrink-0"
            />
            <span className={cn(
              "text-sm truncate",
              homeWinning && isFinished && "font-bold"
            )}>
              {match.homeTeam?.shortName || match.homeTeam?.name || 'Home'}
            </span>
          </div>
          {showScores ? (
            <AnimatedScore
              score={homeScore}
              matchId={match.id}
              teamKey="home"
              isLive={isLive}
              className={cn(
                "text-sm ml-2",
                isLive && "text-destructive",
                homeWinning && isFinished && "text-green-500"
              )}
            />
          ) : (
            <span className="text-sm tabular-nums ml-2 font-medium">-</span>
          )}
        </div>
      </div>

      {/* Odds - 2 cols */}
      {showOdds && (
        <div className="col-span-2 text-center space-y-1">
          {isFanDuel && (
            <div className="flex items-center justify-center mb-0.5">
              <Star className="h-2.5 w-2.5 text-primary fill-primary" />
            </div>
          )}
          <div className={cn("text-xs flex items-center justify-center gap-0.5", isFanDuel ? "text-primary font-medium" : "text-muted-foreground")}>
            {getMoneyline(false) || '-'}
            {getMovementIcon(false)}
          </div>
          <div className={cn("text-xs flex items-center justify-center gap-0.5", isFanDuel ? "text-primary font-medium" : "text-muted-foreground")}>
            {getMoneyline(true) || '-'}
            {getMovementIcon(true)}
          </div>
        </div>
      )}

      {/* Sharp/Badges + Favorite - 2 cols */}
      <div className="col-span-2 flex items-center justify-end gap-1">
        <SharpMoneyBadge
          matchId={match.id}
          homeTeam={match.homeTeam?.name || ''}
          awayTeam={match.awayTeam?.name || ''}
          league={match.league}
          compact
        />
        <FavoriteButton
          type="match"
          id={match.id}
          name={`${match.awayTeam?.shortName || 'Away'} @ ${match.homeTeam?.shortName || 'Home'}`}
          size="sm"
        />
      </div>
    </div>
  );
}

export default ScoreboardRow;
