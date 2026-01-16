
import { useMemo } from "react";
import { Match } from "@/types/sports";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTopScenariosForMatch } from "@/utils/scenarioAnalysis/scenarioDetector";
import { RiskLevel } from "@/utils/scenarioAnalysis/types";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  Zap,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioBadgesProps {
  match: Match;
  maxBadges?: number;
}

const RISK_STYLES: Record<RiskLevel, string> = {
  'very-low': 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  'low': 'bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/30',
  'medium': 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
  'high': 'bg-cyan-600/20 text-cyan-800 dark:text-cyan-300 border-cyan-600/30',
  'very-high': 'bg-destructive/20 text-destructive dark:text-destructive border-destructive/30'
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'moneyline': <Target className="h-3 w-3" />,
  'spread': <TrendingUp className="h-3 w-3" />,
  'totals': <TrendingDown className="h-3 w-3" />,
  'live': <Zap className="h-3 w-3" />,
  'parlay': <AlertTriangle className="h-3 w-3" />,
  'strategic': <Shield className="h-3 w-3" />,
  'situational': <Target className="h-3 w-3" />,
};

export default function ScenarioBadges({ match, maxBadges = 3 }: ScenarioBadgesProps) {
  const detectedScenarios = useMemo(() => {
    return getTopScenariosForMatch(match, maxBadges);
  }, [match, maxBadges]);

  if (detectedScenarios.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {detectedScenarios.map((detection) => (
        <Tooltip key={detection.scenario.id}>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs cursor-help flex items-center gap-1 transition-all hover:scale-105",
                RISK_STYLES[detection.scenario.riskLevel]
              )}
            >
              {CATEGORY_ICONS[detection.scenario.category]}
              {detection.scenario.shortName}
              {detection.scenario.expectedROI > 0 && (
                <span className="text-green-500 font-semibold">
                  +{detection.scenario.expectedROI.toFixed(0)}%
                </span>
              )}
              {detection.scenario.expectedROI < 0 && (
                <span className="text-red-400 font-semibold">
                  {detection.scenario.expectedROI.toFixed(0)}%
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="font-semibold">{detection.scenario.name}</div>
              <p className="text-xs text-muted-foreground">
                {detection.scenario.description}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Win Rate:</span>
                <span className="font-medium">{detection.scenario.historicalWinRate}%</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">Risk:</span>
                <span className={cn(
                  "font-medium",
                  detection.scenario.riskLevel === 'very-low' || detection.scenario.riskLevel === 'low' 
                    ? "text-green-500" 
                    : detection.scenario.riskLevel === 'medium' 
                      ? "text-amber-500" 
                      : "text-red-500"
                )}>
                  {detection.scenario.riskLevel}
                </span>
              </div>
              {detection.matchFactors.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Detected: </span>
                  {detection.matchFactors.slice(0, 2).join(', ')}
                </div>
              )}
              <div className="text-xs text-primary font-medium pt-1 border-t border-border">
                Click Scenarios in nav for full analysis →
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      
      {/* +EV indicator if available */}
      {match.prediction?.expectedValue && match.prediction.expectedValue > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="text-xs cursor-help flex items-center gap-1 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 animate-pulse"
            >
              <TrendingUp className="h-3 w-3" />
              +EV {((match.prediction.evPercentage || 0)).toFixed(1)}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs p-3">
            <div className="space-y-1">
              <div className="font-semibold text-green-500">Positive Expected Value</div>
              <p className="text-xs text-muted-foreground">
                This bet has a calculated edge over the market. 
                True probability exceeds implied odds.
              </p>
              <div className="text-xs">
                <span className="text-muted-foreground">Kelly Stake: </span>
                <span className="font-medium">
                  {((match.prediction.kellyFraction || 0) * 100).toFixed(1)}% of bankroll
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
