import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award, DollarSign } from "lucide-react";
import { Match } from "@/types/sports";

interface BettingMetricsProps {
  match: Match;
}

const BettingMetrics = ({ match }: BettingMetricsProps) => {
  const { prediction } = match;

  // Only show if we have sharp betting metrics
  if (!prediction.evPercentage && !prediction.kellyStakeUnits && !prediction.clvPercentage) {
    return null;
  }

  const getEVBadgeColor = (ev: number | undefined) => {
    if (!ev) return "bg-muted";
    if (ev >= 5) return "bg-green-500";
    if (ev >= 3) return "bg-emerald-500";
    if (ev >= 0) return "bg-blue-500";
    return "bg-muted";
  };

  const getCLVBadgeColor = (clv: number | undefined) => {
    if (!clv) return "bg-muted";
    if (clv >= 5) return "bg-green-500";
    if (clv >= 2) return "bg-emerald-500";
    if (clv >= 0) return "bg-blue-500";
    return "bg-red-500";
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Card className="mt-4 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Sharp Betting Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Expected Value (EV) */}
        {prediction.evPercentage !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Expected Value</span>
            </div>
            <Badge 
              className={`${getEVBadgeColor(prediction.evPercentage)} text-white font-bold text-sm w-full justify-center`}
            >
              {formatPercentage(prediction.evPercentage)}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {prediction.evPercentage >= 3 ? 'Strong bet' : prediction.evPercentage >= 0 ? 'Marginal' : 'Skip'}
            </p>
          </div>
        )}

        {/* Kelly Criterion Stake */}
        {prediction.kellyStakeUnits !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Kelly Stake</span>
            </div>
            <Badge 
              variant="outline"
              className="font-bold text-sm w-full justify-center bg-primary/10 border-primary/30"
            >
              {prediction.kellyStakeUnits.toFixed(2)} units
            </Badge>
            <p className="text-xs text-muted-foreground">
              {prediction.kellyFraction && `${(prediction.kellyFraction * 100).toFixed(1)}% of bankroll`}
            </p>
          </div>
        )}

        {/* Closing Line Value (CLV) */}
        {prediction.clvPercentage !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>CLV</span>
            </div>
            <Badge 
              className={`${getCLVBadgeColor(prediction.clvPercentage)} text-white font-bold text-sm w-full justify-center`}
            >
              {formatPercentage(prediction.clvPercentage)}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {prediction.beatClosingLine ? 'Beat closing ✓' : 'Below closing'}
            </p>
          </div>
        )}

        {/* True Probability */}
        {prediction.trueProbability !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Win Probability</span>
            </div>
            <Badge 
              variant="outline"
              className="font-bold text-sm w-full justify-center bg-accent/50"
            >
              {(prediction.trueProbability * 100).toFixed(1)}%
            </Badge>
            <p className="text-xs text-muted-foreground">
              {prediction.impliedOdds && `Fair odds: ${prediction.impliedOdds.toFixed(2)}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BettingMetrics;
