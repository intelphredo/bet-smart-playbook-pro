import { Match } from "@/types/sports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Radio, CheckCircle2 } from "lucide-react";

interface MatchesGridProps {
  matches: Match[];
  type: "upcoming" | "live" | "finished";
  maxItems?: number;
  isLoading?: boolean;
}

const MatchesGrid = ({ matches, type, maxItems = 6, isLoading }: MatchesGridProps) => {
  const displayMatches = matches.slice(0, maxItems);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {displayMatches.map((match) => (
        <MatchCard key={match.id} match={match} type={type} />
      ))}
    </div>
  );
};

const MatchCard = ({ match, type }: { match: Match; type: string }) => {
  const homeScore = match.score?.home;
  const awayScore = match.score?.away;
  const hasScores = homeScore !== undefined && awayScore !== undefined;
  const smartScoreValue = match.smartScore?.overall ?? 0;

  return (
    <Card className="p-4 hover:bg-accent/5 transition-colors cursor-pointer group">
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
          score={awayScore}
          isWinner={hasScores && (awayScore ?? 0) > (homeScore ?? 0)}
          showScore={type !== "upcoming"}
        />
        <TeamRow 
          name={match.homeTeam?.name || "TBD"}
          score={homeScore}
          isWinner={hasScores && (homeScore ?? 0) > (awayScore ?? 0)}
          showScore={type !== "upcoming"}
          isHome
        />
      </div>

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
    </Card>
  );
};

const TeamRow = ({ 
  name, 
  score, 
  isWinner, 
  showScore,
  isHome 
}: { 
  name: string; 
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
      <span className={cn(
        "text-sm",
        isWinner ? "text-foreground" : "text-muted-foreground"
      )}>
        {name}
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
