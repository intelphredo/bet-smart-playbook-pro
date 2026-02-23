import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, ChevronRight, Target, Activity, Zap } from "lucide-react";

interface TopValuePanelProps {
  matches: Match[];
}

function SmartScoreBreakdown({ match }: { match: Match }) {
  const ss = match.smartScore;
  if (!ss) return null;

  const components = [
    { label: "Value", value: ss.components.value, color: "bg-primary" },
    { label: "Momentum", value: ss.components.momentum, color: "bg-blue-500" },
    { label: "Odds Mvmt", value: ss.components.oddsMovement, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-2 mt-2">
      {components.map(c => (
        <div key={c.label} className="flex items-center gap-2 text-xs">
          <span className="w-20 text-muted-foreground">{c.label}</span>
          <Progress value={c.value} className="h-1.5 flex-1" />
          <span className="w-8 text-right font-medium">{c.value}</span>
        </div>
      ))}
    </div>
  );
}

export const TopValuePanel = memo(function TopValuePanel({ matches }: TopValuePanelProps) {
  const navigate = useNavigate();

  const topMatches = useMemo(() => {
    return matches
      .filter(m => m.smartScore && m.smartScore.overall > 0)
      .sort((a, b) => (b.smartScore?.overall || 0) - (a.smartScore?.overall || 0))
      .slice(0, 3);
  }, [matches]);

  return (
    <Card className="border-primary/20 h-full">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Top Rated Value</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigate('/top-rated')}>
            View All <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 px-4 space-y-3">
        {topMatches.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No rated matches yet</p>
          </div>
        )}

        {topMatches.map((match, i) => {
          const ss = match.smartScore;
          const overall = ss?.overall || 0;
          const homeName = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
          const awayName = match.awayTeam?.shortName || match.awayTeam?.name || "Away";

          return (
            <div
              key={match.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                i === 0 ? "bg-primary/5 border-primary/20" : "bg-card border-border/50"
              )}
              onClick={() => navigate(`/game/${match.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {i === 0 && <Zap className="h-4 w-4 text-primary" />}
                  <span className="font-semibold text-sm">
                    {awayName} @ {homeName}
                  </span>
                </div>
                <Badge
                  className={cn(
                    "text-xs font-bold",
                    overall >= 75 ? "bg-primary text-primary-foreground" :
                    overall >= 60 ? "bg-blue-500 text-white" :
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {overall}
                </Badge>
              </div>

              {match.league && (
                <Badge variant="outline" className="mt-1 text-[10px] h-5">{match.league}</Badge>
              )}

              {i === 0 && <SmartScoreBreakdown match={match} />}

              {i > 0 && ss && (
                <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span>Value: {Math.round(ss.components.value)}</span>
                  <span>Mom: {Math.round(ss.components.momentum)}</span>
                </div>
              )}
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 text-xs"
          onClick={() => navigate('/games')}
        >
          <Activity className="h-3.5 w-3.5 mr-1.5" />
          Click for detailed analysis
        </Button>
      </CardContent>
    </Card>
  );
});
