
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, parseISO } from "date-fns";
import LiveOdds from "./LiveOdds";
import MatchParticipant from "./MatchCard/MatchParticipant";
import OddsComparisonTable from "./MatchCard/OddsComparisonTable";
import PredictedOddsRow from "./MatchCard/PredictedOddsRow";
import MatchCardFooter from "./MatchCard/MatchCardFooter";
import BettingMetrics from "./BettingMetrics";
import ScenarioBadges from "./ScenarioAnalysis/ScenarioBadges";
import { SocialFactorsCard } from "./SocialIntelligence/SocialFactorsCard";

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
    <Card className="match-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card/95 backdrop-blur-sm">
      <CardHeader className="p-4 bg-card/80 backdrop-blur-sm border-b border-border/30 flex flex-row justify-between items-center space-y-0">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs font-medium bg-background/90 border-primary/20 text-primary">
            {match.league}
          </Badge>
          {match.status === "live" && (
            <Badge className="bg-destructive text-destructive-foreground animate-pulse shadow-sm">
              ● LIVE
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {formatTime(match.startTime)}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 items-center mb-6">
          <MatchParticipant team={match.homeTeam} />
          <div className="text-center">
            {match.status === "live" ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {match.score?.home} - {match.score?.away}
                </div>
                <div className="text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded-full inline-block">
                  {match.score?.period}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground font-medium bg-accent/30 px-3 py-1 rounded-full">
                vs
              </div>
            )}
          </div>
          <MatchParticipant team={match.awayTeam} />
        </div>
        
        {/* Scenario Detection Badges */}
        <ScenarioBadges match={match} maxBadges={3} />
        
        <OddsComparisonTable match={match} formatOdds={formatOdds} />
        <PredictedOddsRow match={match} formatOdds={formatOdds} />
        <BettingMetrics match={match} />
        
        {/* Social Intelligence */}
        <SocialFactorsCard match={match} compact />
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
