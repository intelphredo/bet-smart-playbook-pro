import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import LiveOdds from "./LiveOdds";
import MatchParticipant from "./MatchCard/MatchParticipant";
import OddsComparisonTable from "./MatchCard/OddsComparisonTable";
import PredictedOddsRow from "./MatchCard/PredictedOddsRow";
import MatchCardFooter from "./MatchCard/MatchCardFooter";
import BettingMetrics from "./BettingMetrics";
import ScenarioBadges from "./ScenarioAnalysis/ScenarioBadges";
import { SocialFactorsCard } from "./SocialIntelligence/SocialFactorsCard";
import MatchSourceBadge, { MatchDataSource } from "./MatchCard/MatchSourceBadge";
import OddsLineChart from "./OddsLineChart";
import FavoriteButton from "./FavoriteButton";
import { InjuryImpactBadge } from "./InjuryImpactBadge";
import { useMatchInjuryImpact } from "@/hooks/useMatchInjuryImpact";

interface MatchCardProps {
  match: any;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { injuryImpact, hasSignificantImpact } = useMatchInjuryImpact(match);

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

  // Determine data source for this match
  const getMatchSource = (): MatchDataSource => {
    const isFromEspn = match.homeTeam?.logo && match.homeTeam.logo.length > 0;
    const hasOddsData = match.liveOdds && match.liveOdds.length > 0;
    
    if (isFromEspn && hasOddsData) return "combined";
    if (hasOddsData && !isFromEspn) return "odds";
    return "espn";
  };
  
  const matchSource = getMatchSource();
  const hasOddsData = match.liveOdds && match.liveOdds.length > 0;
  const hasAdvancedMetrics = match.prediction?.evPercentage || match.prediction?.kellyStakeUnits || match.prediction?.clvPercentage;

  return (
    <Card className="match-card overflow-hidden border-border/50 bg-card/95 backdrop-blur-sm relative">
      {/* Favorite Button - Positioned Absolutely */}
      <FavoriteButton 
        type="match" 
        id={match.id} 
        className="absolute top-2 right-2 z-10" 
      />
      
      {/* Compact Header */}
      <CardHeader className="p-3 bg-card/80 backdrop-blur-sm border-b border-border/30 flex flex-row justify-between items-center space-y-0 pr-10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium bg-background/90 border-primary/20 text-primary h-5 px-2">
            {match.league}
          </Badge>
          {match.status === "live" && (
            <Badge className="bg-destructive text-destructive-foreground animate-pulse h-5 px-2 text-xs">
              ● LIVE
            </Badge>
          )}
          <MatchSourceBadge source={matchSource} hasOddsData={hasOddsData} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {formatTime(match.startTime)}
        </span>
      </CardHeader>

      <CardContent className="p-4">
        {/* Team matchup - more compact */}
        <div className="grid grid-cols-3 gap-3 items-center mb-4">
          <MatchParticipant team={match.homeTeam} />
          <div className="text-center">
            {match.status === "live" ? (
              <div className="space-y-0.5">
                <div className="text-xl font-bold text-foreground tracking-tight">
                  {match.score?.home} - {match.score?.away}
                </div>
                <div className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full inline-block">
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
        
        {/* Scenario Detection Badges - show max 2 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <ScenarioBadges match={match} maxBadges={2} />
          {hasSignificantImpact && (
            <InjuryImpactBadge impact={injuryImpact} compact />
          )}
        </div>
        
        {/* Core odds info */}
        <OddsComparisonTable match={match} />
        <PredictedOddsRow match={match} />
        
        {/* Footer with SmartScore */}
        <MatchCardFooter 
          match={match} 
          getBadgeColor={getBadgeColor} 
          getSmartScoreBadgeColor={getSmartScoreBadgeColor} 
        />

        {/* Expandable Advanced Section */}
        {(hasAdvancedMetrics || hasOddsData) && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show More Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <BettingMetrics match={match} />
              <SocialFactorsCard match={match} compact />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      {/* Odds Chart and Live Odds - outside card content for better separation */}
      {hasOddsData && (
        <>
          <OddsLineChart match={match} />
          <div className="px-4 pb-4">
            <LiveOdds odds={match.liveOdds} />
          </div>
        </>
      )}
    </Card>
  );
};

export default MatchCard;
