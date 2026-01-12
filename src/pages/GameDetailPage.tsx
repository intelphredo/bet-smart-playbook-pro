// src/pages/GameDetailPage.tsx

import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSportsData } from "@/hooks/useSportsData";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { Match, League } from "@/types/sports";
import NavBar from "@/components/NavBar";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import TeamLogo from "@/components/match/TeamLogo";
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
  Radio,
  Trophy,
  TrendingUp,
  Users
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const league = match.league as League;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <NavBar />
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        <AppBreadcrumb />

        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Match Header Card - Hero Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-6 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-semibold">
                    {match.league || "Unknown"}
                  </Badge>
                  {isLive && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <Radio className="h-3 w-3 mr-1" />
                      LIVE
                    </Badge>
                  )}
                  {isFinished && (
                    <Badge variant="secondary">
                      <Trophy className="h-3 w-3 mr-1" />
                      FINAL
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {match.isMockData ? "Demo Data" : "Live Data"}
                </span>
              </div>
            </div>
            
            <CardContent className="py-8">
              {/* Teams with Logos - Large Hero Display */}
              <div className="flex items-center justify-between gap-4">
                {/* Home Team */}
                <motion.div 
                  className="flex-1 text-center space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex flex-col items-center">
                    <TeamLogo 
                      teamName={match.homeTeam?.name || "Home"} 
                      league={league}
                      size="xl"
                      className="mb-3 shadow-lg"
                    />
                    <h2 className="text-xl md:text-2xl font-bold leading-tight">
                      {match.homeTeam?.name || "Home Team"}
                    </h2>
                    <p className="text-sm text-muted-foreground">Home</p>
                    {match.homeTeam?.record && (
                      <Badge variant="secondary" className="mt-2">
                        {match.homeTeam.record}
                      </Badge>
                    )}
                  </div>
                  {match.score && (
                    <motion.p 
                      className="text-5xl md:text-6xl font-bold text-primary"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {match.score.home}
                    </motion.p>
                  )}
                </motion.div>

                {/* VS Divider */}
                <div className="flex flex-col items-center gap-2 px-4">
                  <div className="text-3xl font-bold text-muted-foreground/50">VS</div>
                  {match.score?.period && (
                    <Badge variant="outline" className="text-xs">
                      {match.score.period}
                    </Badge>
                  )}
                </div>

                {/* Away Team */}
                <motion.div 
                  className="flex-1 text-center space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex flex-col items-center">
                    <TeamLogo 
                      teamName={match.awayTeam?.name || "Away"} 
                      league={league}
                      size="xl"
                      className="mb-3 shadow-lg"
                    />
                    <h2 className="text-xl md:text-2xl font-bold leading-tight">
                      {match.awayTeam?.name || "Away Team"}
                    </h2>
                    <p className="text-sm text-muted-foreground">Away</p>
                    {match.awayTeam?.record && (
                      <Badge variant="secondary" className="mt-2">
                        {match.awayTeam.record}
                      </Badge>
                    )}
                  </div>
                  {match.score && (
                    <motion.p 
                      className="text-5xl md:text-6xl font-bold text-primary"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {match.score.away}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              <Separator className="my-6" />

              {/* Match Info */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{format(parseISO(match.startTime), "EEEE, MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prediction Card */}
        {match.prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  AI Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {match.prediction.confidence !== undefined && (
                    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <p className="text-3xl font-bold text-primary">
                        {Math.round(match.prediction.confidence)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Confidence</p>
                    </div>
                  )}
                  {match.prediction.evPercentage !== undefined && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className={cn(
                        "text-3xl font-bold",
                        match.prediction.evPercentage > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {match.prediction.evPercentage > 0 ? "+" : ""}{match.prediction.evPercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Expected Value</p>
                    </div>
                  )}
                  {match.prediction.kellyFraction !== undefined && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-3xl font-bold">
                        {(match.prediction.kellyFraction * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Kelly Stake</p>
                    </div>
                  )}
                  {match.prediction.recommended && (
                    <div className="text-center p-4 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg border border-accent/30">
                      <div className="flex items-center justify-center gap-2">
                        <TeamLogo 
                          teamName={match.prediction.recommended === 'home' 
                            ? match.homeTeam?.name || '' 
                            : match.awayTeam?.name || ''}
                          league={league}
                          size="sm"
                        />
                        <p className="text-xl font-bold capitalize">
                          {match.prediction.recommended}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Recommended Pick</p>
                    </div>
                  )}
                </div>

                {/* Projected Score */}
                {match.prediction.projectedScore && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3 text-center">Projected Score</p>
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex items-center gap-3">
                        <TeamLogo 
                          teamName={match.homeTeam?.name || ''} 
                          league={league}
                          size="md"
                        />
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">{match.homeTeam?.shortName}</p>
                          <p className="text-3xl font-bold">{match.prediction.projectedScore.home}</p>
                        </div>
                      </div>
                      <span className="text-2xl text-muted-foreground">-</span>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">{match.awayTeam?.shortName}</p>
                          <p className="text-3xl font-bold">{match.prediction.projectedScore.away}</p>
                        </div>
                        <TeamLogo 
                          teamName={match.awayTeam?.name || ''} 
                          league={league}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SmartScore Card */}
        {match.smartScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  SmartScore Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overall Score</span>
                  <div className="flex items-center gap-3">
                    <div className="w-40 h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className={cn(
                          "h-full",
                          match.smartScore.overall >= 70 ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                          match.smartScore.overall >= 50 ? "bg-gradient-to-r from-yellow-500 to-amber-400" : 
                          "bg-gradient-to-r from-red-500 to-rose-400"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${match.smartScore.overall}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="font-bold text-lg min-w-[2rem] text-right">
                      {Math.round(match.smartScore.overall)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Components breakdown */}
                {match.smartScore.components && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ScoreCard label="Momentum" value={match.smartScore.components.momentum} icon={TrendingUp} />
                    <ScoreCard label="Value" value={match.smartScore.components.value} icon={DollarSign} />
                    <ScoreCard label="Odds Movement" value={match.smartScore.components.oddsMovement} icon={BarChart3} />
                    <ScoreCard label="Weather Impact" value={match.smartScore.components.weather} />
                    <ScoreCard label="Injury Impact" value={match.smartScore.components.injuries} icon={Users} />
                    <ScoreCard label="Arbitrage" value={match.smartScore.components.arbitrage} icon={DollarSign} />
                  </div>
                )}

                {match.smartScore.hasArbitrageOpportunity && (
                  <motion.div 
                    className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                  >
                    <div className="flex items-center gap-2 text-green-600">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-semibold">Arbitrage Opportunity Detected!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Risk-free profit available across different sportsbooks
                    </p>
                  </motion.div>
                )}

                {match.smartScore.recommendation && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-primary capitalize">
                        Bet on: {match.smartScore.recommendation.betOn} ({match.smartScore.recommendation.confidence} confidence)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.smartScore.recommendation.reasoning}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Odds Card */}
        {match.liveOdds && match.liveOdds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
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
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <span className="font-medium">
                        {typeof odds.sportsbook === 'string' ? odds.sportsbook : odds.sportsbook?.name || `Sportsbook ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-6">
                        <OddsDisplay 
                          label={match.homeTeam?.shortName || "Home"} 
                          odds={odds.homeWin} 
                          teamName={match.homeTeam?.name}
                          league={league}
                        />
                        <OddsDisplay 
                          label={match.awayTeam?.shortName || "Away"} 
                          odds={odds.awayWin}
                          teamName={match.awayTeam?.name}
                          league={league}
                        />
                        {odds.draw !== undefined && (
                          <OddsDisplay label="Draw" odds={odds.draw} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Base Odds Card (fallback if no live odds) */}
        {(!match.liveOdds || match.liveOdds.length === 0) && match.odds && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Odds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around p-6 bg-muted/50 rounded-lg">
                  <OddsDisplay 
                    label={match.homeTeam?.shortName || "Home"} 
                    odds={match.odds.homeWin}
                    teamName={match.homeTeam?.name}
                    league={league}
                    large
                  />
                  {match.odds.draw !== undefined && (
                    <OddsDisplay label="Draw" odds={match.odds.draw} large />
                  )}
                  <OddsDisplay 
                    label={match.awayTeam?.shortName || "Away"} 
                    odds={match.odds.awayWin}
                    teamName={match.awayTeam?.name}
                    league={league}
                    large
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Helper to format odds
const formatOdds = (odds: number): string => {
  if (odds >= 2) {
    const american = Math.round((odds - 1) * 100);
    return american > 0 ? `+${american}` : `${american}`;
  }
  return odds > 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
};

// Odds display component with optional team logo
const OddsDisplay: React.FC<{ 
  label: string; 
  odds: number;
  teamName?: string;
  league?: League;
  large?: boolean;
}> = ({ label, odds, teamName, league, large }) => (
  <div className="text-center">
    {teamName && league && (
      <TeamLogo 
        teamName={teamName} 
        league={league} 
        size="sm" 
        className="mx-auto mb-1"
      />
    )}
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn(
      "font-mono font-bold",
      large ? "text-2xl" : "text-lg"
    )}>
      {formatOdds(odds)}
    </p>
  </div>
);

// Score card component for SmartScore breakdown
const ScoreCard: React.FC<{ 
  label: string; 
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="p-3 bg-muted/30 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all",
            value >= 70 ? "bg-green-500" :
            value >= 50 ? "bg-yellow-500" : "bg-red-500"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn(
        "font-bold text-sm min-w-[1.5rem] text-right",
        value >= 70 ? "text-green-500" :
        value >= 50 ? "text-yellow-500" : "text-red-500"
      )}>
        {Math.round(value)}
      </span>
    </div>
  </div>
);

export default GameDetailPage;
