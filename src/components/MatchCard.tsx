
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, parseISO } from "date-fns";
import LiveOdds from "./LiveOdds";
import MatchParticipant from "./MatchCard/MatchParticipant";
import OddsComparisonTable from "./MatchCard/OddsComparisonTable";
import PredictedOddsRow from "./MatchCard/PredictedOddsRow";
import MatchCardFooter from "./MatchCard/MatchCardFooter";

interface MatchCardProps {
  match: any;
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
          <MatchParticipant team={match.homeTeam} />
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
          <MatchParticipant team={match.awayTeam} />
        </div>
        <OddsComparisonTable match={match} formatOdds={formatOdds} />
        <PredictedOddsRow match={match} formatOdds={formatOdds} />
        <MatchCardFooter 
          match={match} 
          getBadgeColor={getBadgeColor} 
          getSmartScoreBadgeColor={getSmartScoreBadgeColor} 
        />
      </CardContent>
      {match.liveOdds && match.liveOdds.length > 0 && (
        <LiveOdds odds={match.liveOdds} />
      )}
    </Card>
  );
};

export default MatchCard;
