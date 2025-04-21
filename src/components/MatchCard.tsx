
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy, Chart } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import LiveOdds from "./LiveOdds";
import { SPORTSBOOK_LOGOS } from "@/utils/sportsbook";

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const formatTime = (timeString: string) => {
    try {
      const date = parseISO(timeString);
      if (match.status === "live") {
        return "LIVE";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return timeString;
    }
  };

  const formatOdds = (odds: number | undefined) => {
    if (odds === undefined) return "-";
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-500 hover:bg-green-600";
    if (confidence >= 50) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const showOddsComparison = match.liveOdds && match.liveOdds.length > 0;

  const hasSmartScore = match.smartScore !== undefined;
  
  const getSmartScoreBadgeColor = () => {
    if (!match.smartScore) return "bg-gray-500";
    if (match.smartScore.overall >= 80) return "bg-green-500";
    if (match.smartScore.overall >= 60) return "bg-yellow-500";
    if (match.smartScore.overall >= 40) return "bg-blue-500";
    return "bg-red-500";
  };

  return (
    <Card className="match-card overflow-hidden">
      <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700 flex flex-row justify-between items-center space-y-0">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-navy-600">
            {match.league}
          </Badge>
          {match.status === "live" && (
            <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(match.startTime)}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-2 items-center mb-4">
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
            {match.status === "live" ? (
              <div className="text-xl font-bold">
                {match.score?.home} - {match.score?.away}
                <div className="text-xs text-muted-foreground mt-1">{match.score?.period}</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">vs</div>
            )}
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
        
        {showOddsComparison && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-navy-600 dark:text-navy-200">
              Opening Odds vs Live Odds
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded text-xs">
                <thead>
                  <tr className="bg-navy-50 dark:bg-navy-700">
                    <th className="px-2 py-1 text-left font-normal">Sportsbook</th>
                    <th className="px-2 py-1">Home</th>
                    {match.odds.draw !== undefined && <th className="px-2 py-1">Draw</th>}
                    <th className="px-2 py-1">Away</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1 text-muted-foreground font-semibold">Opening</td>
                    <td className="px-2 py-1">{formatOdds(match.odds.homeWin)}</td>
                    {match.odds.draw !== undefined && (
                      <td className="px-2 py-1">{formatOdds(match.odds.draw)}</td>
                    )}
                    <td className="px-2 py-1">{formatOdds(match.odds.awayWin)}</td>
                  </tr>
                  {match.liveOdds!.map((odd) => (
                    <tr key={odd.sportsbook.id} className="border-t">
                      <td className="px-2 py-1 flex items-center gap-2">
                        <span className="inline-block w-5 h-5 bg-white dark:bg-gray-800 rounded p-0.5">
                          <img
                            src={odd.sportsbook.logo || SPORTSBOOK_LOGOS[odd.sportsbook.id as keyof typeof SPORTSBOOK_LOGOS]}
                            alt={odd.sportsbook.name}
                            className="w-full h-full object-contain"
                          />
                        </span>
                        <span>{odd.sportsbook.name}</span>
                      </td>
                      <td className="px-2 py-1">{formatOdds(odd.homeWin)}</td>
                      {odd.draw !== undefined && match.odds.draw !== undefined ? (
                        <td className="px-2 py-1">{formatOdds(odd.draw)}</td>
                      ) : (match.odds.draw !== undefined ? <td className="px-2 py-1 text-muted-foreground">-</td> : null)}
                      <td className="px-2 py-1">{formatOdds(odd.awayWin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button variant="outline" size="sm" className="w-full">
            {formatOdds(match.odds.homeWin)}
          </Button>
          {match.odds.draw ? (
            <Button variant="outline" size="sm" className="w-full">
              {formatOdds(match.odds.draw)}
            </Button>
          ) : (
            <div className="text-center text-xs text-muted-foreground flex items-center justify-center">
              {match.prediction.projectedScore.home} - {match.prediction.projectedScore.away}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full">
            {formatOdds(match.odds.awayWin)}
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <Badge 
            className={`flex items-center gap-1 ${getBadgeColor(match.prediction.confidence)}`}
          >
            <Trophy className="h-3 w-3" />
            {match.prediction.recommended === "home" 
              ? match.homeTeam.shortName 
              : match.prediction.recommended === "away" 
                ? match.awayTeam.shortName 
                : "Draw"
            }
          </Badge>
          
          {hasSmartScore ? (
            <Badge 
              className={`flex items-center gap-1 ${getSmartScoreBadgeColor()}`}
            >
              <Chart className="h-3 w-3" />
              <span>SmartScore {match.smartScore!.overall}</span>
            </Badge>
          ) : (
            <div className="flex items-center text-xs gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>{match.prediction.confidence}% confidence</span>
            </div>
          )}
        </div>
      </CardContent>
      {match.liveOdds && match.liveOdds.length > 0 && (
        <LiveOdds odds={match.liveOdds} />
      )}
    </Card>
  );
};

export default MatchCard;
