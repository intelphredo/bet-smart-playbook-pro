import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VirtualizedList from "../VirtualizedList";
import { Match } from "@/types/sports";

interface Props {
  isLoading: boolean;
  finishedMatches: Match[];
}

// Memoized compact finished match card - much lighter than full MatchCard
const FinishedMatchCard = memo(({ match }: { match: Match }) => (
  <Card className="overflow-hidden">
    <CardHeader className="p-3 bg-muted/30 flex flex-row justify-between items-center space-y-0">
      <Badge variant="outline" className="text-xs font-normal">
        {match.league}
      </Badge>
      <span className="text-xs text-muted-foreground">Finished</span>
    </CardHeader>
    <CardContent className="p-4">
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-muted rounded-full mx-auto mb-1 flex items-center justify-center overflow-hidden">
            {match.homeTeam?.logo ? (
              <img
                src={match.homeTeam.logo}
                alt=""
                className="w-8 h-8 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-xs font-medium">
                {match.homeTeam?.shortName?.substring(0, 2)}
              </span>
            )}
          </div>
          <p className="text-sm font-medium truncate">{match.homeTeam?.shortName}</p>
          <p className="text-xs text-muted-foreground">{match.homeTeam?.record}</p>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">
            {match.score?.home} - {match.score?.away}
          </div>
          {match.score?.period && (
            <p className="text-xs text-muted-foreground mt-1">{match.score.period}</p>
          )}
        </div>
        <div className="text-center">
          <div className="w-10 h-10 bg-muted rounded-full mx-auto mb-1 flex items-center justify-center overflow-hidden">
            {match.awayTeam?.logo ? (
              <img
                src={match.awayTeam.logo}
                alt=""
                className="w-8 h-8 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-xs font-medium">
                {match.awayTeam?.shortName?.substring(0, 2)}
              </span>
            )}
          </div>
          <p className="text-sm font-medium truncate">{match.awayTeam?.shortName}</p>
          <p className="text-xs text-muted-foreground">{match.awayTeam?.record}</p>
        </div>
      </div>
    </CardContent>
  </Card>
));

FinishedMatchCard.displayName = "FinishedMatchCard";

const FinishedMatchesTab = ({ isLoading, finishedMatches }: Props) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (finishedMatches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No finished matches for this league.</p>
        </CardContent>
      </Card>
    );
  }

  // Group into rows of 3 for grid layout
  const rows = useMemo(() => {
    const result: Match[][] = [];
    for (let i = 0; i < finishedMatches.length; i += 3) {
      result.push(finishedMatches.slice(i, i + 3));
    }
    return result;
  }, [finishedMatches]);

  // For small lists, render directly
  if (finishedMatches.length <= 12) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finishedMatches.map((match) => (
          <FinishedMatchCard key={match.id} match={match} />
        ))}
      </div>
    );
  }

  // Virtualized for large lists
  return (
    <VirtualizedList
      items={rows}
      estimatedItemHeight={180}
      maxHeight={600}
      overscan={2}
      renderItem={(row) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {row.map((match) => (
            <FinishedMatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    />
  );
};

export default FinishedMatchesTab;
