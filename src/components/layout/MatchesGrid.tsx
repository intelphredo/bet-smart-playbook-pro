import { useState } from "react";
import { Match, League } from "@/types/sports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Radio, CheckCircle2, Star } from "lucide-react";
import MatchDetailModal from "./MatchDetailModal";
import { TeamLogoImage } from "@/components/ui/TeamLogoImage";
import { getPrimaryOdds, formatAmericanOdds } from "@/utils/sportsbook";

interface MatchesGridProps {
  matches: Match[];
  type: "upcoming" | "live" | "finished";
  maxItems?: number;
  isLoading?: boolean;
}

const MatchesGrid = ({ matches, type, maxItems = 6, isLoading }: MatchesGridProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayMatches = matches.slice(0, maxItems);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-3" />
            <div className="h-6 bg-muted rounded w-2/3 mb-2" />
            <div className="h-6 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (displayMatches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No {type} matches available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayMatches.map((match) => (
          <MatchCard 
            key={match.id} 
            match={match} 
            type={type} 
            onClick={() => handleMatchClick(match)}
          />
        ))}
      </div>

      <MatchDetailModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

const MatchCard = ({ 
  match, 
  type, 
  onClick 
}: { 
  match: Match; 
  type: string; 
  onClick: () => void;
}) => {
  const league = match.league;
  const homeScore = match.score?.home;
  const awayScore = match.score?.away;
  const hasScores = homeScore !== undefined && awayScore !== undefined;
  const smartScoreValue = match.smartScore?.overall ?? 0;
  
  // Get FanDuel odds as primary
  const primaryOdds = getPrimaryOdds(match.liveOdds || []);
  const isFanDuel = primaryOdds?.sportsbook.id.toLowerCase().includes('fanduel');
  
  const formatMoneyline = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined) return null;
    if (value >= 100) return `+${Math.round(value)}`;
    if (value <= -100) return `${Math.round(value)}`;
    return formatAmericanOdds(value);
  };

  const homeML = primaryOdds ? formatMoneyline(primaryOdds.homeWin) : null;
  const awayML = primaryOdds ? formatMoneyline(primaryOdds.awayWin) : null;

  return (
    <Card 
      className="p-4 hover:bg-accent/5 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className="text-[10px]">
          {match.league}
        </Badge>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {type === "live" ? (
            <>
              <Radio className="h-3 w-3 text-red-500 animate-pulse" />
              <span className="text-red-500 font-medium">LIVE</span>
            </>
          ) : type === "finished" ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Final</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              <span>{format(new Date(match.startTime), "h:mm a")}</span>
            </>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        <TeamRow 
          name={match.awayTeam?.name || "TBD"}
          shortName={match.awayTeam?.shortName}
          logo={match.awayTeam?.logo}
          league={league}
          score={awayScore}
          isWinner={hasScores && (awayScore ?? 0) > (homeScore ?? 0)}
          showScore={type !== "upcoming"}
        />
        <TeamRow 
          name={match.homeTeam?.name || "TBD"}
          shortName={match.homeTeam?.shortName}
          logo={match.homeTeam?.logo}
          league={league}
          score={homeScore}
          isWinner={hasScores && (homeScore ?? 0) > (awayScore ?? 0)}
          showScore={type !== "upcoming"}
          isHome
        />
      </div>

      {/* FanDuel Odds - Primary Display */}
      {primaryOdds && type !== "finished" && (
        <div className={cn(
          "mt-3 pt-3 border-t",
          isFanDuel ? "border-primary/30" : "border-border/50"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              {isFanDuel && <Star className="h-3 w-3 text-primary fill-primary" />}
              <span className={cn("text-[10px] font-medium", isFanDuel ? "text-primary" : "text-muted-foreground")}>
                {primaryOdds.sportsbook.name}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground truncate">{match.awayTeam?.shortName || 'Away'}</span>
              <span className={cn("font-medium tabular-nums", isFanDuel && "text-primary")}>{awayML || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground truncate">{match.homeTeam?.shortName || 'Home'}</span>
              <span className={cn("font-medium tabular-nums", isFanDuel && "text-primary")}>{homeML || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Smart Score if available */}
      {smartScoreValue > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Smart Score</span>
            <Badge 
              variant={smartScoreValue >= 70 ? "default" : "secondary"}
              className={cn(
                smartScoreValue >= 80 && "bg-green-500",
                smartScoreValue >= 70 && smartScoreValue < 80 && "bg-yellow-500"
              )}
            >
              {smartScoreValue}
            </Badge>
          </div>
        </div>
      )}

      {/* Hover indicator */}
      <div className="mt-3 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-center text-muted-foreground">Click for details</p>
      </div>
    </Card>
  );
};

const TeamRow = ({ 
  name, 
  shortName,
  logo,
  league,
  score, 
  isWinner, 
  showScore,
  isHome 
}: { 
  name: string;
  shortName?: string;
  logo?: string;
  league?: League;
  score?: number; 
  isWinner: boolean;
  showScore: boolean;
  isHome?: boolean;
}) => (
  <div className={cn(
    "flex items-center justify-between py-1",
    isWinner && "font-semibold"
  )}>
    <div className="flex items-center gap-2">
      <TeamLogoImage 
        teamName={name}
        logoUrl={logo}
        league={league}
        size="xs"
        showFallback
      />
      <span className={cn(
        "text-sm",
        isWinner ? "text-foreground" : "text-muted-foreground"
      )}>
        {shortName || name}
      </span>
      {isHome && (
        <span className="text-[10px] text-muted-foreground/60 uppercase">home</span>
      )}
    </div>
    {showScore && score !== undefined && (
      <span className={cn(
        "text-lg tabular-nums font-bold",
        isWinner ? "text-foreground" : "text-muted-foreground"
      )}>
        {score}
      </span>
    )}
  </div>
);

export default MatchesGrid;
