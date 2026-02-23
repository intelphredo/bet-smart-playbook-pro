import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dice5, Shield, TrendingUp, AlertTriangle, Gauge, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonteCarloResult } from "@/domain/prediction/monteCarloEngine";

interface MonteCarloCardProps {
  mc: MonteCarloResult | null;
  homeTeam?: string;
  awayTeam?: string;
}

const calibrationMeta: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  'well-calibrated': { label: 'Well Calibrated', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: Shield },
  'overconfident': { label: 'Overconfident', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
  'underconfident': { label: 'Underconfident', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: TrendingUp },
  'uncertain': { label: 'High Uncertainty', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: AlertTriangle },
};

const MonteCarloCard: React.FC<MonteCarloCardProps> = ({ mc, homeTeam = 'Home', awayTeam = 'Away' }) => {
  if (!mc) return null;

  const cal = calibrationMeta[mc.calibrationSignal] ?? calibrationMeta['uncertain'];
  const CalIcon = cal.icon;

  // Build visual bar for pick distribution
  const picks = mc.pickDistribution;
  const homePct = Math.round((picks.home ?? 0) * 100);
  const awayPct = Math.round((picks.away ?? 0) * 100);
  const skipPct = Math.round((picks.skip ?? 0) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dice5 className="h-5 w-5 text-primary" />
          Monte Carlo Uncertainty
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            {mc.numSamples} samples
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Interval */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              Confidence Interval
            </span>
            <Badge variant="outline" className={cn("text-xs", cal.color)}>
              <CalIcon className="h-3 w-3 mr-1" />
              {cal.label}
            </Badge>
          </div>
          <ConfidenceBandBar
            lower={mc.confidence.lower}
            point={mc.confidence.point}
            upper={mc.confidence.upper}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>{mc.confidence.lower.toFixed(1)}%</span>
            <span className="font-medium text-foreground">{mc.confidence.point.toFixed(1)}% ± {mc.confidence.stdDev.toFixed(1)}</span>
            <span>{mc.confidence.upper.toFixed(1)}%</span>
          </div>
        </div>

        <Separator />

        {/* Score Uncertainty */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Projected Score Ranges
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ScoreRange
              team={homeTeam}
              band={mc.projectedScoreHome}
              isHome
            />
            <ScoreRange
              team={awayTeam}
              band={mc.projectedScoreAway}
              isHome={false}
            />
          </div>
        </div>

        <Separator />

        {/* Pick Stability & Distribution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pick Stability</span>
            <span className={cn(
              "text-sm font-bold",
              mc.pickStability >= 0.85 ? "text-emerald-500" :
              mc.pickStability >= 0.65 ? "text-amber-500" :
              "text-red-500"
            )}>
              {(mc.pickStability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {homePct > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${homePct}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{homeTeam}: {homePct}% of samples</p>
                </TooltipContent>
              </Tooltip>
            )}
            {awayPct > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ width: `${awayPct}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{awayTeam}: {awayPct}% of samples</p>
                </TooltipContent>
              </Tooltip>
            )}
            {skipPct > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="bg-muted-foreground/30 transition-all"
                    style={{ width: `${skipPct}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Skip: {skipPct}% of samples</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            {homePct > 0 && <span className="text-emerald-500">{homeTeam} {homePct}%</span>}
            {awayPct > 0 && <span className="text-blue-500">{awayTeam} {awayPct}%</span>}
            {skipPct > 0 && <span>Skip {skipPct}%</span>}
          </div>
        </div>

        {/* EV Uncertainty */}
        <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">EV Range</p>
            <p className="text-sm font-medium">
              {mc.evPercentage.lower > 0 ? '+' : ''}{mc.evPercentage.lower.toFixed(1)}%
              {' → '}
              {mc.evPercentage.upper > 0 ? '+' : ''}{mc.evPercentage.upper.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">True Prob Range</p>
            <p className="text-sm font-medium">
              {(mc.trueProbability.lower * 100).toFixed(1)}% – {(mc.trueProbability.upper * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// Sub-components
// ============================================

function ConfidenceBandBar({ lower, point, upper }: { lower: number; point: number; upper: number }) {
  // Normalize to 30-100 range for visual
  const min = 30;
  const max = 100;
  const range = max - min;
  const lPct = ((lower - min) / range) * 100;
  const pPct = ((point - min) / range) * 100;
  const uPct = ((upper - min) / range) * 100;

  return (
    <div className="relative h-6 bg-muted rounded-full overflow-hidden">
      {/* CI band */}
      <div
        className="absolute top-0 h-full bg-primary/15 rounded-full"
        style={{
          left: `${Math.max(0, lPct)}%`,
          width: `${Math.max(1, uPct - lPct)}%`,
        }}
      />
      {/* Point estimate marker */}
      <div
        className="absolute top-0.5 bottom-0.5 w-1 bg-primary rounded-full shadow-sm"
        style={{ left: `${Math.max(0, Math.min(99, pPct))}%` }}
      />
    </div>
  );
}

function ScoreRange({ team, band, isHome }: { team: string; band: { lower: number; point: number; upper: number; stdDev: number }; isHome: boolean }) {
  return (
    <div className={cn(
      "p-2.5 rounded-lg text-center",
      isHome ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-blue-500/5 border border-blue-500/10"
    )}>
      <p className="text-xs text-muted-foreground truncate">{team}</p>
      <p className="text-lg font-bold">{band.point.toFixed(1)}</p>
      <p className="text-[10px] text-muted-foreground">
        {band.lower.toFixed(1)} – {band.upper.toFixed(1)}
      </p>
    </div>
  );
}

export default MonteCarloCard;
