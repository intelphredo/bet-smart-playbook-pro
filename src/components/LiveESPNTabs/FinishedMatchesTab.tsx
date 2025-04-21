
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FinishedMatchInfo from "@/components/FinishedMatchInfo";

interface Props {
  isLoading: boolean;
  finishedMatches: any[];
}

const FinishedMatchesTab = ({ isLoading, finishedMatches }: Props) => {
  if (isLoading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  if (finishedMatches.length === 0)
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>No finished matches for this league.</p>
        </CardContent>
      </Card>
    );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {finishedMatches.map((match) => (
        <Card key={match.id} className="overflow-hidden">
          <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700 flex flex-row justify-between items-center space-y-0">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-navy-600">{match.league}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Finished
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 items-center mb-2">
              <div className="text-center">
                <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                  {match.homeTeam.logo ? (
                    <img
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      className="w-8 h-8 object-contain rounded-full"
                    />
                  ) : (
                    match.homeTeam.shortName.substring(0, 2)
                  )}
                </div>
                <div className="text-sm font-medium truncate">{match.homeTeam.shortName}</div>
                <div className="text-xs text-muted-foreground">{match.homeTeam.record}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {match.score?.home} - {match.score?.away}
                  <div className="text-xs text-muted-foreground mt-1">{match.score?.period}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                  {match.awayTeam.logo ? (
                    <img
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name}
                      className="w-8 h-8 object-contain rounded-full"
                    />
                  ) : (
                    match.awayTeam.shortName.substring(0, 2)
                  )}
                </div>
                <div className="text-sm font-medium truncate">{match.awayTeam.shortName}</div>
                <div className="text-xs text-muted-foreground">{match.awayTeam.record}</div>
              </div>
            </div>
            <FinishedMatchInfo match={match} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FinishedMatchesTab;
