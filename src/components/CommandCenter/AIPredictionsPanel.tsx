import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import { useHistoricalPredictions } from "@/hooks/useHistoricalPredictions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, ChevronRight, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface AIPredictionsPanelProps {
  matches: Match[];
}

export const AIPredictionsPanel = memo(function AIPredictionsPanel({ matches }: AIPredictionsPanelProps) {
  const navigate = useNavigate();
  const { data: histData } = useHistoricalPredictions("14d", "all");

  const topAIPicks = useMemo(() => {
    return matches
      .filter(m => m.prediction && m.prediction.confidence >= 55)
      .sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0))
      .slice(0, 3);
  }, [matches]);

  const stats = histData?.stats;
  const winRate = stats ? (stats.winRate || 0).toFixed(1) : null;
  const totalPredictions = stats?.total || 0;
  const recentLossCategory = useMemo(() => {
    if (!histData?.predictions) return null;
    const losses = histData.predictions.filter(p => p.status === 'lost');
    if (losses.length === 0) return null;
    // Simple categorization
    const recent = losses.slice(0, 5);
    const blowouts = recent.filter(p => {
      const diff = Math.abs((p.actual_score_home || 0) - (p.actual_score_away || 0));
      return diff > 15;
    });
    if (blowouts.length >= 2) return "Blowout losses";
    return null;
  }, [histData]);

  return (
    <Card className="border-cyan-500/20 h-full">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-cyan-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10">
              <Brain className="h-4 w-4 text-cyan-500" />
            </div>
            <CardTitle className="text-base">AI Picks</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-cyan-500" onClick={() => navigate('/ai-predictions')}>
            View All <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 px-4 space-y-3">
        {/* Today's stats strip */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-[10px] bg-muted/50">
            {totalPredictions} total predictions
          </Badge>
          {winRate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Win Rate: <span className={cn("font-semibold", Number(winRate) >= 52 ? "text-green-500" : "text-muted-foreground")}>{winRate}%</span></span>
            </div>
          )}
        </div>

        {/* Top picks */}
        {topAIPicks.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No AI picks available</p>
          </div>
        )}

        {topAIPicks.map((match) => {
          const conf = match.prediction?.confidence || 0;
          const homeName = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
          const awayName = match.awayTeam?.shortName || match.awayTeam?.name || "Away";
          const pick = match.prediction?.recommended || "";

          return (
            <div
              key={match.id}
              className="p-3 rounded-lg border border-border/50 bg-card cursor-pointer transition-all hover:shadow-md hover:border-cyan-500/30"
              onClick={() => navigate(`/game/${match.id}`)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {awayName} @ {homeName}
                </span>
                <Badge className={cn(
                  "text-xs font-bold",
                  conf >= 70 ? "bg-green-500 text-white" :
                  conf >= 60 ? "bg-cyan-500 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  {conf}%
                </Badge>
              </div>
              {pick && (
                <p className="text-xs text-muted-foreground mt-1 truncate">Pick: {pick}</p>
              )}
              {match.league && (
                <Badge variant="outline" className="mt-1 text-[10px] h-5">{match.league}</Badge>
              )}
            </div>
          );
        })}

        {/* Recent loss category learning */}
        {recentLossCategory && (
          <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              <span className="font-medium">Learn: {recentLossCategory}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Model struggled with these recently — review patterns
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
