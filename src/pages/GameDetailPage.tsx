// src/pages/GameDetailPage.tsx

import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSportsData } from "@/hooks/useSportsData";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { Match } from "@/types/sports";
import NavBar from "@/components/NavBar";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Zap,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Radio
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const GameDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { upcomingMatches, liveMatches, finishedMatches, isLoading } = useSportsData({
    refreshInterval: 30000,
    useExternalApis: true,
  });

  // Combine all matches and apply smart scores
  const allMatches = useMemo(() => {
    const combined = [...upcomingMatches, ...liveMatches, ...finishedMatches];
    return applySmartScores(combined);
  }, [upcomingMatches, liveMatches, finishedMatches]);

  // Find the specific match
  const match = useMemo(() => allMatches.find((m) => m.id === id), [allMatches, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <AppBreadcrumb />
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The game you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        <AppBreadcrumb />

        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Match Header Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{match.league || "Unknown"}</Badge>
                {isLive && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                )}
                {isFinished && (
                  <Badge variant="secondary">FINAL</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {match.isMockData ? "Demo Data" : "Live Data"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Teams */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold">{match.homeTeam?.name || "Home Team"}</h2>
                <p className="text-sm text-muted-foreground">Home</p>
                {match.score && (
                  <p className="text-4xl font-bold mt-2">{match.score.home}</p>
                )}
              </div>
              <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold">{match.awayTeam?.name || "Away Team"}</h2>
                <p className="text-sm text-muted-foreground">Away</p>
                {match.score && (
                  <p className="text-4xl font-bold mt-2">{match.score.away}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Match Info */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(match.startTime), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Card */}
        {match.prediction && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                AI Prediction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {match.prediction.confidence !== undefined && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(match.prediction.confidence)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                )}
                {match.prediction.evPercentage !== undefined && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className={cn(
                      "text-2xl font-bold",
                      match.prediction.evPercentage > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {match.prediction.evPercentage > 0 ? "+" : ""}{match.prediction.evPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Expected Value</p>
                  </div>
                )}
                {match.prediction.kellyFraction !== undefined && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {(match.prediction.kellyFraction * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Kelly Stake</p>
                  </div>
                )}
                {match.prediction.recommended && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-xl font-bold text-primary capitalize">
                      {match.prediction.recommended}
                    </p>
                    <p className="text-xs text-muted-foreground">Recommended Pick</p>
                  </div>
                )}
              </div>

              {/* Projected Score */}
              {match.prediction.projectedScore && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Projected Score</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{match.homeTeam?.shortName}</p>
                      <p className="text-2xl font-bold">{match.prediction.projectedScore.home}</p>
                    </div>
                    <span className="text-muted-foreground">-</span>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{match.awayTeam?.shortName}</p>
                      <p className="text-2xl font-bold">{match.prediction.projectedScore.away}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SmartScore Card */}
        {match.smartScore && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5" />
                SmartScore Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Overall Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        match.smartScore.overall >= 70 ? "bg-green-500" :
                        match.smartScore.overall >= 50 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${match.smartScore.overall}%` }}
                    />
                  </div>
                  <span className="font-bold">{Math.round(match.smartScore.overall)}</span>
                </div>
              </div>

              <Separator />

              {/* Components breakdown */}
              {match.smartScore.components && (
                <div className="grid grid-cols-2 gap-4">
                  <ScoreRow label="Momentum" value={match.smartScore.components.momentum} />
                  <ScoreRow label="Value" value={match.smartScore.components.value} />
                  <ScoreRow label="Odds Movement" value={match.smartScore.components.oddsMovement} />
                  <ScoreRow label="Weather Impact" value={match.smartScore.components.weather} />
                  <ScoreRow label="Injury Impact" value={match.smartScore.components.injuries} />
                  <ScoreRow label="Arbitrage" value={match.smartScore.components.arbitrage} />
                </div>
              )}

              {match.smartScore.hasArbitrageOpportunity && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Arbitrage Opportunity Detected!</span>
                  </div>
                </div>
              )}

              {match.smartScore.recommendation && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-primary capitalize">
                      Bet on: {match.smartScore.recommendation.betOn} ({match.smartScore.recommendation.confidence} confidence)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.smartScore.recommendation.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Odds Card */}
        {match.liveOdds && match.liveOdds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Live Odds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {match.liveOdds.map((odds, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">
                      {typeof odds.sportsbook === 'string' ? odds.sportsbook : odds.sportsbook?.name || `Sportsbook ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Home</p>
                        <p className="font-mono font-bold">
                          {formatOdds(odds.homeWin)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Away</p>
                        <p className="font-mono font-bold">
                          {formatOdds(odds.awayWin)}
                        </p>
                      </div>
                      {odds.draw !== undefined && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Draw</p>
                          <p className="font-mono font-bold">
                            {formatOdds(odds.draw)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Base Odds Card (fallback if no live odds) */}
        {(!match.liveOdds || match.liveOdds.length === 0) && match.odds && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Odds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Home Win</p>
                  <p className="text-xl font-mono font-bold">{formatOdds(match.odds.homeWin)}</p>
                </div>
                {match.odds.draw !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Draw</p>
                    <p className="text-xl font-mono font-bold">{formatOdds(match.odds.draw)}</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Away Win</p>
                  <p className="text-xl font-mono font-bold">{formatOdds(match.odds.awayWin)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Helper to format odds
const formatOdds = (odds: number): string => {
  if (odds >= 2) {
    // Decimal odds - convert to American
    const american = Math.round((odds - 1) * 100);
    return american > 0 ? `+${american}` : `${american}`;
  }
  // Already American or small decimal
  return odds > 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
};

// Helper component for score rows
const ScoreRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn(
      "font-medium",
      value >= 70 ? "text-green-500" :
      value >= 50 ? "text-yellow-500" : "text-red-500"
    )}>
      {Math.round(value)}
    </span>
  </div>
);

export default GameDetailPage;
