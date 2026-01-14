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
    <div className="relative rounded-xl p-4 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Sharp Metrics</span>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
      </div>
      
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Expected Value (EV) */}
        {prediction.evPercentage !== undefined && (
          <div className="space-y-1.5 p-2 rounded-lg bg-card/50 border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary/70" />
              <span>EV</span>
            </div>
            <Badge className={`${getEVBadgeColor(prediction.evPercentage)} text-xs font-bold w-full justify-center shadow-sm`}>
              {formatPercentage(prediction.evPercentage)}
            </Badge>
          </div>
        )}

        {/* Kelly Criterion Stake */}
        {prediction.kellyStakeUnits !== undefined && (
          <div className="space-y-1.5 p-2 rounded-lg bg-card/50 border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 text-primary/70" />
              <span>Kelly</span>
            </div>
            <Badge variant="outline" className="text-xs font-bold w-full justify-center bg-primary/10 border-primary/30 text-primary">
              {prediction.kellyStakeUnits.toFixed(1)}u
            </Badge>
          </div>
        )}

        {/* Closing Line Value (CLV) */}
        {prediction.clvPercentage !== undefined && (
          <div className="space-y-1.5 p-2 rounded-lg bg-card/50 border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3 w-3 text-primary/70" />
              <span>CLV</span>
            </div>
            <Badge className={`${getCLVBadgeColor(prediction.clvPercentage)} text-xs font-bold w-full justify-center shadow-sm`}>
              {formatPercentage(prediction.clvPercentage)}
            </Badge>
          </div>
        )}

        {/* True Probability */}
        {prediction.trueProbability !== undefined && (
          <div className="space-y-1.5 p-2 rounded-lg bg-card/50 border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3 w-3 text-primary/70" />
              <span>Win%</span>
            </div>
            <Badge variant="outline" className="text-xs font-bold w-full justify-center bg-accent/20 border-accent/30">
              {(prediction.trueProbability * 100).toFixed(0)}%
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingMetrics;
