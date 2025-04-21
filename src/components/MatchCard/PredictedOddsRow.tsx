
import { Button } from "@/components/ui/button";

interface Props {
  match: any;
  formatOdds: (odds: number | undefined) => string;
}

const PredictedOddsRow = ({ match, formatOdds }: Props) => {
  return (
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
  );
};
export default PredictedOddsRow;
