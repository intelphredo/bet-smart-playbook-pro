
import { Badge } from "@/components/ui/badge";
import { Trophy, ChartLine, TrendingUp } from "lucide-react";

interface Props {
  match: any;
  getBadgeColor: (confidence: number) => string;
  getSmartScoreBadgeColor: () => string;
}

const MatchCardFooter = ({ match, getBadgeColor, getSmartScoreBadgeColor }: Props) => {
  const hasSmartScore = match.smartScore !== undefined;
  return (
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
          <ChartLine className="h-3 w-3" />
          <span>SmartScore {match.smartScore!.overall}</span>
        </Badge>
      ) : (
        <div className="flex items-center text-xs gap-1">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span>{match.prediction.confidence}% confidence</span>
        </div>
      )}
    </div>
  );
};

export default MatchCardFooter;
