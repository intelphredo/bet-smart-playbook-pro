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
    if (!ev) return "bg-muted text-muted-foreground";
    if (ev >= 5) return "bg-green-500 text-white";
    if (ev >= 3) return "bg-emerald-500 text-white";
    if (ev >= 0) return "bg-blue-500 text-white";
    return "bg-muted text-muted-foreground";
  };

  const getCLVBadgeColor = (clv: number | undefined) => {
    if (!clv) return "bg-muted text-muted-foreground";
    if (clv >= 5) return "bg-green-500 text-white";
    if (clv >= 2) return "bg-emerald-500 text-white";
    if (clv >= 0) return "bg-blue-500 text-white";
    return "bg-red-500 text-white";
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Sharp Metrics</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Expected Value (EV) */}
        {prediction.evPercentage !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>EV</span>
            </div>
            <Badge className={`${getEVBadgeColor(prediction.evPercentage)} text-xs font-semibold w-full justify-center`}>
              {formatPercentage(prediction.evPercentage)}
            </Badge>
          </div>
        )}

        {/* Kelly Criterion Stake */}
        {prediction.kellyStakeUnits !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Kelly</span>
            </div>
            <Badge variant="outline" className="text-xs font-semibold w-full justify-center bg-primary/5 border-primary/20">
              {prediction.kellyStakeUnits.toFixed(1)}u
            </Badge>
          </div>
        )}

        {/* Closing Line Value (CLV) */}
        {prediction.clvPercentage !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>CLV</span>
            </div>
            <Badge className={`${getCLVBadgeColor(prediction.clvPercentage)} text-xs font-semibold w-full justify-center`}>
              {formatPercentage(prediction.clvPercentage)}
            </Badge>
          </div>
        )}

        {/* True Probability */}
        {prediction.trueProbability !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Win%</span>
            </div>
            <Badge variant="outline" className="text-xs font-semibold w-full justify-center bg-accent/10">
              {(prediction.trueProbability * 100).toFixed(0)}%
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingMetrics;
