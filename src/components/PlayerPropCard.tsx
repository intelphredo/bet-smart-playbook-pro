
import { PlayerProp } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy } from "lucide-react";

interface PlayerPropCardProps {
  prop: PlayerProp;
}

const PlayerPropCard = ({ prop }: PlayerPropCardProps) => {
  const formatOdds = (odds: number) => {
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-500 hover:bg-green-600";
    if (confidence >= 50) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
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

        <div className="flex justify-between items-center">
          <Badge 
            className={`flex items-center gap-1 ${getBadgeColor(prop.prediction.confidence)}`}
          >
            <Trophy className="h-3 w-3" />
            {prop.prediction.recommended.toUpperCase()}
          </Badge>
          <div className="flex items-center text-xs gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span>{prop.prediction.confidence}% confidence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerPropCard;
