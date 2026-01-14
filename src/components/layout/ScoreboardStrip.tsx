// ESPN-style Scoreboard Strip - Horizontal scrolling live scores
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Match } from '@/types/sports';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AnimatedScore from '@/components/ui/AnimatedScore';
import { TeamLogoImage } from '@/components/ui/TeamLogoImage';

interface ScoreboardStripProps {
  matches: Match[];
  className?: string;
}

export function ScoreboardStrip({ matches, className }: ScoreboardStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (matches.length === 0) return null;

  return (
    <div className={cn("relative bg-muted/30 border-b", className)}>
      {/* Left Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-gradient-to-r from-background/90 to-transparent hover:from-background"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable Scores */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-10 py-2 gap-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.map((match) => (
          <ScoreCard key={match.id} match={match} onClick={() => navigate(`/game/${match.id}`)} />
        ))}
      </div>

      {/* Right Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-gradient-to-l from-background/90 to-transparent hover:from-background"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ScoreCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const formatTime = () => {
    if (isLive) return match.score?.period || 'LIVE';
    if (isFinished) return 'Final';
    
    const date = new Date(match.startTime);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const showScores = isLive || isFinished;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[160px] bg-card hover:bg-accent/50 rounded-lg p-2.5 border transition-colors text-left",
        isLive && "border-red-500/50 bg-red-500/5"
      )}
    >
      {/* League & Time */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground font-medium uppercase">
          {match.league}
        </span>
        <span className={cn(
          "text-[10px] font-medium",
          isLive ? "text-red-500" : "text-muted-foreground"
        )}>
          {formatTime()}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-1.5">
        <TeamRow 
          matchId={match.id}
          teamKey="away"
          name={match.awayTeam?.shortName || match.awayTeam?.name || 'Away'} 
          logo={match.awayTeam?.logo}
          league={match.league}
          score={showScores ? (match.score?.away ?? 0) : undefined}
          isWinning={isFinished && (match.score?.away || 0) > (match.score?.home || 0)}
          isLive={isLive}
        />
        <TeamRow 
          matchId={match.id}
          teamKey="home"
          name={match.homeTeam?.shortName || match.homeTeam?.name || 'Home'} 
          logo={match.homeTeam?.logo}
          league={match.league}
          score={showScores ? (match.score?.home ?? 0) : undefined}
          isWinning={isFinished && (match.score?.home || 0) > (match.score?.away || 0)}
          isLive={isLive}
        />
      </div>
    </button>
  );
}

interface TeamRowProps {
  matchId: string;
  teamKey: 'home' | 'away';
  name: string;
  logo?: string;
  league?: string;
  score?: number;
  isWinning?: boolean;
  isLive?: boolean;
}

function TeamRow({ matchId, teamKey, name, logo, league, score, isWinning, isLive }: TeamRowProps) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <TeamLogoImage
          teamName={name}
          logoUrl={logo}
          league={league as any}
          size="xs"
          className="flex-shrink-0"
        />
        <span className={cn(
          "text-xs truncate",
          isWinning ? "font-bold" : "font-medium"
        )}>
          {name}
        </span>
      </div>
      {score !== undefined && (
        <AnimatedScore
          score={score}
          matchId={matchId}
          teamKey={teamKey}
          isLive={isLive}
          className={cn(
            "text-xs",
            isWinning && "text-green-500",
            isLive && "text-red-500"
          )}
        />
      )}
    </div>
  );
}

export default ScoreboardStrip;
