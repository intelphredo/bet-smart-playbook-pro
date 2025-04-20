
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

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

  const formatOdds = (odds: number) => {
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-500 hover:bg-green-600";
    if (confidence >= 50) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
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
              {match.homeTeam.shortName.substring(0, 2)}
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
              {match.awayTeam.shortName.substring(0, 2)}
            </div>
            <div className="text-sm font-medium truncate">{match.awayTeam.shortName}</div>
            <div className="text-xs text-muted-foreground">{match.awayTeam.record}</div>
          </div>
        </div>
        
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
          <div className="flex items-center text-xs gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span>{match.prediction.confidence}% confidence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
