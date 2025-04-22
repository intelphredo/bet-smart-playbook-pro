
import { PlayerProp } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy, Flame, Snowflake, History } from "lucide-react";
import { analyzePlayerProp } from "@/utils/playerAnalysisAlgorithm";

interface PlayerPropCardProps {
  prop: PlayerProp;
}

const PlayerPropCard = ({ prop }: PlayerPropCardProps) => {
  // Use our new algorithm to analyze the prop
  const analysis = analyzePlayerProp(prop);
  
  const formatOdds = (odds: number) => {
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500 hover:bg-green-600";
    if (confidence >= 65) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  // Determine if player is on a streak based on algorithm analysis
  const getStreakBadge = () => {
    if (analysis.streakImpact >= 5) {
      return (
        <Badge className="flex items-center gap-1 bg-orange-500">
          <Flame className="h-3 w-3" />
          HOT STREAK
        </Badge>
      );
    }
    if (analysis.streakImpact <= -5) {
      return (
        <Badge className="flex items-center gap-1 bg-blue-500">
          <Snowflake className="h-3 w-3" />
          COLD STREAK
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="player-prop-card overflow-hidden">
      <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold">{prop.playerName}</span>
            <span className="text-sm text-muted-foreground">{prop.team}</span>
          </div>
          <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-navy-600">
            {prop.propType.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="text-center text-2xl font-bold mb-2">
            {prop.line}
          </div>
          {prop.lastGames && (
            <div className="text-xs text-muted-foreground text-center mb-2">
              Last 5: {prop.lastGames.join(' - ')}
              {prop.seasonAverage && (
                <span className="ml-2">
                  (Season: {prop.seasonAverage.toFixed(1)})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button variant="outline" size="sm" className="w-full">
            O {prop.line} {formatOdds(prop.odds.over)}
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            U {prop.line} {formatOdds(prop.odds.under)}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Badge 
              className={`flex items-center gap-1 ${getBadgeColor(analysis.confidence)}`}
            >
              <Trophy className="h-3 w-3" />
              {analysis.recommendation.toUpperCase()} {analysis.confidence}%
            </Badge>
            
            {getStreakBadge()}
          </div>
          
          {analysis.matchupImpact !== 0 && (
            <div className="flex items-center text-xs gap-1 mt-1">
              <History className="h-3 w-3" />
              {analysis.matchupImpact > 0 ? (
                <span className="text-green-600">Strong vs this opponent</span>
              ) : (
                <span className="text-red-600">Struggles vs this opponent</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerPropCard;
