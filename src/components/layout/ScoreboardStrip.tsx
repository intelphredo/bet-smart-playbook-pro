// ESPN-style Scoreboard Strip - Horizontal scrolling live scores with premium styling
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
    <div className={cn(
      "relative border-b overflow-hidden",
      "bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20",
      "backdrop-blur-sm",
      className
    )}>
      {/* Premium gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Left Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none",
          "bg-gradient-to-r from-background via-background/95 to-transparent",
          "hover:from-background hover:via-background",
          "border-r border-border/20"
        )}
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </Button>

      {/* Scrollable Scores */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-10 py-2.5 gap-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.map((match, index) => (
          <ScoreCard 
            key={match.id} 
            match={match} 
            onClick={() => navigate(`/game/${match.id}`)}
            index={index}
          />
        ))}
      </div>

      {/* Right Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none",
          "bg-gradient-to-l from-background via-background/95 to-transparent",
          "hover:from-background hover:via-background",
          "border-l border-border/20"
        )}
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Button>
      
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </div>
  );
}

function ScoreCard({ match, onClick, index }: { match: Match; onClick: () => void; index: number }) {
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
        "flex-shrink-0 w-[165px] rounded-lg p-2.5 text-left relative overflow-hidden group",
        "transition-all duration-300",
        "border",
        // Base styling
        "bg-card/80 hover:bg-card border-border/40 hover:border-primary/30",
        "hover:shadow-md hover:shadow-primary/5",
        // Live state with animated glow
        isLive && "border-red-500/40 bg-gradient-to-br from-red-500/10 to-transparent",
        // Finished state
        isFinished && "bg-gradient-to-br from-muted/50 to-transparent"
      )}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </div>
      
      {/* Live pulse indicator */}
      {isLive && (
        <div className="absolute top-1 right-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
      )}

      {/* League & Time */}
      <div className="flex items-center justify-between mb-2 relative">
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          isLive ? "text-red-500" : "text-primary/70"
        )}>
          {match.league}
        </span>
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded",
          isLive ? "text-red-500 bg-red-500/10" : "text-muted-foreground bg-muted/50"
        )}>
          {formatTime()}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-1.5 relative">
        <TeamRow 
          matchId={match.id}
          teamKey="away"
          teamName={match.awayTeam?.name || match.awayTeam?.shortName || 'Away'}
          displayName={match.awayTeam?.shortName || match.awayTeam?.name || 'Away'}
          teamId={match.awayTeam?.id}
          logo={match.awayTeam?.logo}
          league={match.league}
          score={showScores ? match.score?.away : undefined}
          isWinning={isFinished && (match.score?.away || 0) > (match.score?.home || 0)}
          isLive={isLive}
        />
        <TeamRow 
          matchId={match.id}
          teamKey="home"
          teamName={match.homeTeam?.name || match.homeTeam?.shortName || 'Home'}
          displayName={match.homeTeam?.shortName || match.homeTeam?.name || 'Home'}
          teamId={match.homeTeam?.id}
          logo={match.homeTeam?.logo}
          league={match.league}
          score={showScores ? match.score?.home : undefined}
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
  teamName: string;
  displayName: string;
  teamId?: string;
  logo?: string;
  league?: string;
  score?: number;
  isWinning?: boolean;
  isLive?: boolean;
}

function TeamRow({ matchId, teamKey, teamName, displayName, teamId, logo, league, score, isWinning, isLive }: TeamRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-1.5 py-0.5 px-1 rounded transition-colors",
      isWinning && "bg-emerald-500/10"
    )}>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <TeamLogoImage
          teamName={teamName}
          teamId={teamId}
          logoUrl={logo}
          league={league as any}
          size="xs"
          className="flex-shrink-0"
        />
        <span className={cn(
          "text-xs truncate transition-colors",
          isWinning ? "font-bold text-foreground" : "font-medium text-foreground/80"
        )}>
          {displayName}
        </span>
      </div>
      {score !== undefined && (
        <AnimatedScore
          score={score}
          matchId={matchId}
          teamKey={teamKey}
          isLive={isLive}
          className={cn(
            "text-xs font-bold tabular-nums min-w-[20px] text-right",
            isWinning && "text-emerald-500",
            isLive && !isWinning && "text-red-500"
          )}
        />
      )}
    </div>
  );
}

export default ScoreboardStrip;
