
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSportsData } from "@/hooks/useSportsData";
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  Database
} from "lucide-react";

export default function CreatorPanel() {
  const { 
    upcomingMatches, 
    liveMatches, 
    finishedMatches, 
    isLoading, 
    error,
    dataSource 
  } = useSportsData({ league: 'ALL', refreshInterval: 30000 });

  const stats = useMemo(() => {
    const totalMatches = upcomingMatches.length + liveMatches.length + finishedMatches.length;
    
    // Calculate prediction accuracy from finished matches
    const matchesWithPredictions = finishedMatches.filter(m => m.prediction && m.score);
    const correctPredictions = matchesWithPredictions.filter(m => {
      if (!m.prediction || !m.score) return false;
      const predicted = m.prediction.recommended;
      const homeWon = m.score.home > m.score.away;
      const awayWon = m.score.away > m.score.home;
      const draw = m.score.home === m.score.away;
      
      return (predicted === 'home' && homeWon) ||
             (predicted === 'away' && awayWon) ||
             (predicted === 'draw' && draw);
    });
    
    const accuracy = matchesWithPredictions.length > 0 
      ? Math.round((correctPredictions.length / matchesWithPredictions.length) * 100)
      : 0;

    // Calculate average confidence
    const avgConfidence = finishedMatches.reduce((sum, m) => 
      sum + (m.prediction?.confidence || 0), 0) / Math.max(finishedMatches.length, 1);

    // Calculate +EV bets
    const evBets = [...upcomingMatches, ...liveMatches].filter(
      m => m.prediction?.expectedValue && m.prediction.expectedValue > 0
    ).length;

    return {
      totalMatches,
      upcomingCount: upcomingMatches.length,
      liveCount: liveMatches.length,
      finishedCount: finishedMatches.length,
      accuracy,
      avgConfidence: Math.round(avgConfidence),
      evBets,
      matchesWithPredictions: matchesWithPredictions.length
    };
  }, [upcomingMatches, liveMatches, finishedMatches]);

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant={error ? "destructive" : "default"} className="flex items-center gap-1">
          {error ? <AlertCircle className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
          {error ? 'Connection Error' : 'Connected'}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          {dataSource}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last refresh: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{stats.totalMatches}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upcomingCount} upcoming · {stats.liveCount} live · {stats.finishedCount} finished
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prediction Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{stats.accuracy}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {stats.matchesWithPredictions} verified predictions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <span className="text-3xl font-bold">{stats.avgConfidence}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all algorithm predictions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              +EV Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="text-3xl font-bold">{stats.evBets}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active positive expected value bets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Matches Quick View */}
      {liveMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live Matches ({liveMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.slice(0, 6).map((match) => (
                <div 
                  key={match.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{match.league}</Badge>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                    </span>
                  </div>
                  <div className="text-sm font-bold">
                    {match.score?.home ?? 0} - {match.score?.away ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">ESPN API</span>
              <Badge variant="default" className="bg-green-500">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">MLB API</span>
              <Badge variant="default" className="bg-green-500">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">Prediction Engine</span>
              <Badge variant="default" className="bg-green-500">Running</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
