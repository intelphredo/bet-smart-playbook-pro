import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TeamLogo from "@/components/match/TeamLogo";
import { League, Match } from "@/types/sports";
import { Target, Brain, TrendingUp, DollarSign, BarChart3, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface AIPredictionDashboardProps {
  match: Match;
  league: League;
}

const AIPredictionDashboard: React.FC<AIPredictionDashboardProps> = ({ match, league }) => {
  const prediction = match.prediction;
  const smartScore = match.smartScore;

  if (!prediction) return null;

  const recommendedTeam =
    prediction.recommended === "home"
      ? match.homeTeam
      : prediction.recommended === "away"
      ? match.awayTeam
      : null;

  const confidence = Math.round(prediction.confidence || 0);
  const confidenceColor =
    confidence >= 70
      ? "text-green-500"
      : confidence >= 55
      ? "text-yellow-500"
      : "text-muted-foreground";

  // Build "Why?" summary
  const whyFactors: string[] = [];
  if (smartScore?.components) {
    const c = smartScore.components;
    if (c.momentum >= 60) whyFactors.push("Strong momentum");
    if (c.value >= 60) whyFactors.push("High betting value");
    if (c.oddsMovement >= 60) whyFactors.push("Favorable odds movement");
    if (c.injuries >= 60) whyFactors.push("Injury advantage");
  }
  if (prediction.recommended) {
    const teamName = recommendedTeam?.shortName || prediction.recommended;
    if (whyFactors.length === 0) {
      whyFactors.push(`${teamName} projected to cover based on model consensus`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Prediction Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary prediction */}
          <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            {recommendedTeam && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <TeamLogo teamName={recommendedTeam.name || ""} league={league} size="md" />
                <span className="text-xl font-bold capitalize">
                  {recommendedTeam.name}
                </span>
              </div>
            )}
            <p className={cn("text-4xl font-bold", confidenceColor)}>
              {confidence}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">Win Probability</p>
          </div>

          {/* Projected score */}
          {prediction.projectedScore && (
            <div className="flex items-center justify-center gap-6 py-3">
              <div className="flex items-center gap-2">
                <TeamLogo teamName={match.homeTeam?.name || ""} league={league} size="sm" />
                <span className="text-sm text-muted-foreground">{match.homeTeam?.shortName}</span>
                <span className="text-2xl font-bold">{prediction.projectedScore.home}</span>
              </div>
              <span className="text-lg text-muted-foreground">-</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{prediction.projectedScore.away}</span>
                <span className="text-sm text-muted-foreground">{match.awayTeam?.shortName}</span>
                <TeamLogo teamName={match.awayTeam?.name || ""} league={league} size="sm" />
              </div>
            </div>
          )}

          {/* Key metrics row */}
          <div className="grid grid-cols-3 gap-2">
            {prediction.evPercentage !== undefined && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p
                  className={cn(
                    "text-xl font-bold",
                    prediction.evPercentage > 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {prediction.evPercentage > 0 ? "+" : ""}
                  {prediction.evPercentage.toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Expected Value</p>
              </div>
            )}
            {prediction.kellyFraction !== undefined && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">
                  {(prediction.kellyFraction * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Kelly Stake</p>
              </div>
            )}
            {smartScore && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p
                  className={cn(
                    "text-xl font-bold",
                    smartScore.overall >= 70
                      ? "text-green-500"
                      : smartScore.overall >= 50
                      ? "text-yellow-500"
                      : "text-red-500"
                  )}
                >
                  {Math.round(smartScore.overall)}
                </p>
                <p className="text-[10px] text-muted-foreground">SmartScore</p>
              </div>
            )}
          </div>

          {/* SmartScore breakdown */}
          {smartScore?.components && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  SmartScore Breakdown
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <ScoreBar label="Momentum" value={smartScore.components.momentum} icon={<TrendingUp className="h-3 w-3" />} />
                  <ScoreBar label="Value" value={smartScore.components.value} icon={<DollarSign className="h-3 w-3" />} />
                  <ScoreBar label="Odds Movement" value={smartScore.components.oddsMovement} icon={<BarChart3 className="h-3 w-3" />} />
                  <ScoreBar label="Weather" value={smartScore.components.weather} />
                  <ScoreBar label="Injuries" value={smartScore.components.injuries} />
                  <ScoreBar label="Arbitrage" value={smartScore.components.arbitrage} icon={<Zap className="h-3 w-3" />} />
                </div>
              </div>
            </>
          )}

          {/* Why summary */}
          {whyFactors.length > 0 && (
            <div className="p-3 bg-accent/50 rounded-lg border border-accent">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Why this pick?
              </p>
              <p className="text-sm">
                {whyFactors.join(" • ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ScoreBar: React.FC<{
  label: string;
  value: number;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => {
  const safeValue = isNaN(value) ? 0 : Math.round(value);
  return (
    <div className="p-2 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-1 mb-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              safeValue >= 70 ? "bg-green-500" : safeValue >= 50 ? "bg-yellow-500" : "bg-red-500"
            )}
            style={{ width: `${safeValue}%` }}
          />
        </div>
        <span
          className={cn(
            "font-bold text-xs min-w-[1.5rem] text-right",
            safeValue >= 70
              ? "text-green-500"
              : safeValue >= 50
              ? "text-yellow-500"
              : "text-red-500"
          )}
        >
          {safeValue}
        </span>
      </div>
    </div>
  );
};

export default AIPredictionDashboard;
